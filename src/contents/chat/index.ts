import OSElement from "../../utils/OSElement";
import { color, font, radius, size, space, tracking, weight } from "../../theme";
import {
  CHAT_MODEL,
  CHAT_MODELS,
  chatEngine,
  type ChatEngine,
  type ChatModel,
  type Message
} from "../../ai/chat";
import type { DevicePreference } from "../../ai/engine";
import { bestDevice } from "../../ai/engine";
import { loadSettings, saveSettings } from "../../Store";

/**
 * A conversation with a model that lives on this machine.
 *
 * Nothing is loaded until this window is opened — not the library, not the
 * weights — and nothing is loaded twice: the engine is shared, so closing the
 * window and opening it again resumes with the model already warm.
 *
 * The window opens immediately and fills in, rather than sitting behind the
 * usual splash. A third of a gigabyte is a wait somebody should be able to
 * watch and change their mind about, and a cover with a spinner says less than
 * a percentage does. That is also why the first thing in the transcript is what
 * this is: half a billion parameters, running here, which writes fluent
 * sentences and invents facts. Better said at the top than discovered at the
 * third question.
 */

/**
 * What the model is told it is, before anybody types.
 *
 * Short, and mostly prohibitions. A small model reads a long preamble as a
 * writing prompt — the first version of this window answered a greeting with a
 * scene, complete with invented colleagues — so the instructions that earn
 * their place are the ones that rule that out: answer, do not narrate, stop.
 */
const SYSTEM: Message = {
  role: "system",
  content: [
    "You are a helpful assistant running locally in James's portfolio desktop.",
    "Answer the user's question directly, in one or two short sentences.",
    "Never invent dialogue, characters, or stage directions.",
    "If you do not know something, say so plainly."
  ].join(" ")
};

type Phase = "loading" | "ready" | "failed";

/** What is remembered between visits. Not the conversation — just the choices. */
interface ChatChoice {
  model: string;
  device: DevicePreference;
}

class ChatContent extends OSElement {
  private engine: ChatEngine;
  private history: Message[] = [SYSTEM];
  private choice: ChatChoice = { model: CHAT_MODEL, device: "auto" };

  private log!: HTMLElement;
  private form!: HTMLFormElement;
  private input!: HTMLTextAreaElement;
  private send!: HTMLButtonElement;
  private status!: HTMLElement;
  private models!: HTMLSelectElement;
  private devices!: HTMLSelectElement;

  private phase: Phase = "loading";
  private answering = false;
  private stop?: AbortController;

  /**
   * How an engine is got, rather than the engine itself.
   *
   * The picker builds a new one whenever the model or the device changes, so
   * what this window needs is the factory — which is also what makes it
   * testable without a gigabyte of weights.
   */
  private readonly makeEngine: (model: string, device: DevicePreference) => ChatEngine;

  constructor(
    makeEngine: (model: string, device: DevicePreference) => ChatEngine = chatEngine
  ) {
    super("chatcontent", "chat-content");
    this.makeEngine = makeEngine;
    this.engine = makeEngine(this.choice.model, this.choice.device);

    this.style = () => ({
      [this.id]: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: font.ui,
        color: color.ink,
        fontSize: size.bodyTight,

        "& .chat-note": {
          flex: "0 0 auto",
          padding: `10px ${space.windowPadX}`,
          borderBottom: `1px solid ${color.lineSoft}`,
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap"
        },
        "& .chat-note b": { color: color.inkSoft, fontWeight: weight.emphasise },

        // ------------------------------------------------------- the picker
        "& .chat-picker": {
          flex: "0 0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: `9px ${space.windowPadX}`,
          borderBottom: `1px solid ${color.lineSoft}`
        },
        "& .chat-choice": {
          display: "flex",
          alignItems: "center",
          gap: "7px",
          minWidth: 0
        },
        "& .chat-choice > span": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint,
          flex: "0 0 auto"
        },
        /*
         * A real `select`. The desktop draws its own everything else, but a
         * native menu is the one control that behaves on a phone — and
         * `color-scheme` is what stops the popup from coming up white on a dark
         * desktop, which is the only reason people reach for a custom one.
         */
        "& .chat-select": {
          minWidth: 0,
          maxWidth: "100%",
          height: "28px",
          padding: "0 8px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.control,
          background: color.chromeRaised,
          color: color.ink,
          font: "inherit",
          fontSize: size.caption,
          cursor: "pointer"
        },
        "& .chat-select:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .chat-select:disabled": { opacity: 0.55, cursor: "default" },

        "& .chat-log": {
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          padding: `14px ${space.windowPadX}`,
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        },

        "& .chat-turn": { display: "flex", flexDirection: "column", gap: "4px" },
        "& .chat-who": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "& .chat-said": {
          margin: 0,
          lineHeight: 1.6,
          color: color.ink,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere"
        },
        "& .chat-turn.is-model .chat-said": { color: color.inkSoft },
        // The caret while it is still writing, so a pause reads as thinking
        // rather than as finished.
        "& .chat-turn.is-writing .chat-said::after": {
          content: "''",
          display: "inline-block",
          width: "7px",
          height: "1em",
          marginLeft: "2px",
          verticalAlign: "-2px",
          background: color.accent,
          opacity: 0.7
        },

        "& .chat-status": {
          margin: 0,
          fontSize: size.caption,
          color: color.inkFaint,
          fontVariantNumeric: "tabular-nums"
        },

        "& .chat-form": {
          flex: "0 0 auto",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          padding: `10px ${space.windowPadX} 12px`,
          borderTop: `1px solid ${color.lineSoft}`
        },
        "& .chat-input": {
          flex: "1 1 auto",
          minWidth: 0,
          resize: "none",
          height: "38px",
          maxHeight: "120px",
          padding: "9px 12px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.control,
          background: color.chrome,
          color: color.ink,
          font: "inherit",
          fontSize: size.bodyTight,
          lineHeight: 1.4
        },
        "& .chat-input:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .chat-input:disabled": { opacity: 0.6 },
        "& .chat-send": {
          flex: "0 0 auto",
          height: "38px",
          padding: "0 16px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: color.chromeRaised,
          color: color.ink,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          cursor: "pointer",
          transition: "background 150ms ease, color 150ms ease"
        },
        "& .chat-send:hover:not(:disabled)": { color: color.accent },
        "& .chat-send:disabled": { opacity: 0.5, cursor: "default" },
        "& .chat-send:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        }
      }
    });

    this.build();
  }

  private build() {
    const note = document.createElement("p");
    note.className = "chat-note";
    const what = document.createElement("b");
    what.appendChild(document.createTextNode("0.5B parameters, running here"));
    note.appendChild(what);
    note.appendChild(
      document.createTextNode(
        "· nothing is sent anywhere · it writes well and makes things up"
      )
    );
    this.element.appendChild(note);

    this.element.appendChild(this.picker());

    this.log = document.createElement("div");
    this.log.className = "chat-log";
    // Answers arrive a word at a time, and a screen reader should hear them
    // when they settle rather than on every token.
    this.log.setAttribute("role", "log");
    this.log.setAttribute("aria-live", "polite");
    this.element.appendChild(this.log);

    this.status = document.createElement("p");
    this.status.className = "chat-status";
    this.log.appendChild(this.status);

    this.form = document.createElement("form");
    this.form.className = "chat-form";

    this.input = document.createElement("textarea");
    this.input.className = "chat-input";
    this.input.rows = 1;
    this.input.placeholder = "Ask it something…";
    this.input.setAttribute("aria-label", "Message");
    this.input.disabled = true;
    // Enter sends, shift-enter is a newline — the arrangement every chat has.
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });

    this.send = document.createElement("button");
    this.send.type = "submit";
    this.send.className = "chat-send";
    this.send.disabled = true;
    this.send.appendChild(document.createTextNode("Send"));

    this.form.append(this.input, this.send);
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.ask();
    });
    this.element.appendChild(this.form);
  }

  /**
   * The two choices: which model, and what runs it.
   *
   * Both are on the window rather than in Settings, because both are things
   * somebody wants to change *while looking at the answers* — and the second
   * one exists at all because "it is slow" and "it is on the CPU" are the same
   * sentence, and nobody can tell which without being told.
   */
  private picker(): HTMLElement {
    const row = document.createElement("div");
    row.className = "chat-picker";

    this.models = document.createElement("select");
    this.models.className = "chat-select";
    this.models.setAttribute("aria-label", "Model");
    CHAT_MODELS.forEach((model: ChatModel) => {
      const option = document.createElement("option");
      option.value = model.id;
      // The size is the part somebody is deciding on, so it is in the label
      // rather than in a tooltip nobody opens.
      option.text = `${model.label} · ${model.size}`;
      option.title = model.note;
      this.models.appendChild(option);
    });
    this.models.value = this.choice.model;
    this.models.addEventListener("change", () => {
      void this.choose({ model: this.models.value });
    });

    this.devices = document.createElement("select");
    this.devices.className = "chat-select";
    this.devices.setAttribute("aria-label", "Runs on");
    const gpu = bestDevice() === "webgpu";
    (
      [
        ["auto", gpu ? "Automatic (GPU)" : "Automatic (CPU)"],
        ["webgpu", gpu ? "GPU" : "GPU — not available here"],
        ["wasm", "CPU"]
      ] as const
    ).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = label;
      // Offered but not selectable: saying why beats leaving it out and
      // letting somebody wonder whether their machine could have done it.
      option.disabled = value === "webgpu" && !gpu;
      this.devices.appendChild(option);
    });
    this.devices.value = this.choice.device;
    this.devices.addEventListener("change", () => {
      void this.choose({ device: this.devices.value as DevicePreference });
    });

    const modelLabel = document.createElement("label");
    modelLabel.className = "chat-choice";
    const modelText = document.createElement("span");
    modelText.appendChild(document.createTextNode("Model"));
    modelLabel.append(modelText, this.models);

    const deviceLabel = document.createElement("label");
    deviceLabel.className = "chat-choice";
    const deviceText = document.createElement("span");
    deviceText.appendChild(document.createTextNode("Runs on"));
    deviceLabel.append(deviceText, this.devices);

    row.append(modelLabel, deviceLabel);
    return row;
  }

  /**
   * Change one of the two, and start again with the other unchanged.
   *
   * The conversation is kept: the point of switching model is usually to ask
   * the same thing of a better one, and throwing the transcript away to prove
   * a point about state would be the wrong answer to that.
   */
  private async choose(change: Partial<ChatChoice>) {
    const next = { ...this.choice, ...change };
    if (next.model === this.choice.model && next.device === this.choice.device) {
      return;
    }
    this.choice = next;
    void saveSettings({ chatModel: next.model, chatDevice: next.device });

    this.stop?.abort();
    this.phase = "loading";
    this.input.disabled = true;
    this.send.disabled = true;
    this.engine = this.makeEngine(next.model, next.device);
    await this.warm();
  }

  async load(element: HTMLElement) {
    await super.load(element);

    /*
     * Read before the model is asked for, so a remembered choice is honoured
     * rather than corrected a moment later — switching models mid-download is
     * two downloads.
     */
    {
      try {
        const saved = await loadSettings();
        const model = CHAT_MODELS.find((m: ChatModel) => m.id === saved.chatModel);
        const device = saved.chatDevice as DevicePreference | undefined;
        if (model) this.choice.model = model.id;
        if (device === "auto" || device === "webgpu" || device === "wasm") {
          this.choice.device = device;
        }
      } catch {
        // The defaults are already in force.
      }
      this.models.value = this.choice.model;
      this.devices.value = this.choice.device;
      this.engine = this.makeEngine(this.choice.model, this.choice.device);
    }

    void this.warm();
  }

  /**
   * Bring the model in, saying how far along it is.
   *
   * Only from here — opening this window is the only thing on the desktop that
   * fetches a model, and closing it without opening it again means nobody ever
   * paid for one.
   */
  private async warm() {
    const chosen = CHAT_MODELS.find((m: ChatModel) => m.id === this.choice.model);
    const size = chosen ? chosen.size : "a few hundred MB";
    this.say(`Downloading the model… ${size}, once, then it is cached.`);
    try {
      await this.engine.load((fraction) => {
        const percent = Math.round(fraction * 100);
        this.say(
          percent >= 100
            ? "Starting it up…"
            : `Downloading the model… ${percent}% of ${size}, once, then cached.`
        );
      });
      this.phase = "ready";
      const where = this.engine.device === "webgpu" ? "on the GPU" : "on the CPU";
      this.say(
        this.engine.fellBackToCpu
          ? `Ready, ${where} — this browser has no WebGPU.`
          : `Ready, ${where}. Say something.`
      );
      this.input.disabled = false;
      this.send.disabled = false;
      this.input.focus();
    } catch (error) {
      this.phase = "failed";
      this.say(
        "The model could not be loaded here. That is usually an old browser, or no room left to cache it."
      );
      this.logger.debug(`chat model failed: ${error}`);
    }
  }

  private say(text: string) {
    this.status.textContent = text;
    this.status.hidden = !text;
  }

  private turn(role: "You" | "Model", text: string): HTMLElement {
    const turn = document.createElement("div");
    turn.className = `chat-turn${role === "Model" ? " is-model" : ""}`;

    const who = document.createElement("span");
    who.className = "chat-who";
    who.appendChild(document.createTextNode(role));
    turn.appendChild(who);

    const said = document.createElement("p");
    said.className = "chat-said";
    said.appendChild(document.createTextNode(text));
    turn.appendChild(said);

    this.log.insertBefore(turn, this.status);
    this.log.scrollTop = this.log.scrollHeight;
    return said;
  }

  private async ask() {
    const question = this.input.value.trim();
    if (!question || this.phase !== "ready" || this.answering) return;

    this.input.value = "";
    this.turn("You", question);
    this.history.push({ role: "user", content: question });

    this.answering = true;
    this.input.disabled = true;
    this.send.disabled = true;
    this.say("Thinking…");

    const said = this.turn("Model", "");
    said.parentElement?.classList.add("is-writing");
    this.stop = new AbortController();

    try {
      const answer = await this.engine.reply(
        this.history,
        (token) => {
          said.textContent += token;
          this.log.scrollTop = this.log.scrollHeight;
        },
        this.stop.signal
      );
      // A model that answered in one piece rather than in tokens.
      if (!said.textContent) said.textContent = answer;
      this.history.push({ role: "assistant", content: said.textContent ?? "" });
      this.say("");
    } catch (error) {
      said.textContent = said.textContent || "It stopped partway through.";
      this.logger.debug(`chat failed: ${error}`);
      this.say("");
    } finally {
      said.parentElement?.classList.remove("is-writing");
      this.answering = false;
      this.stop = undefined;
      if (this.phase === "ready") {
        this.input.disabled = false;
        this.send.disabled = false;
        this.input.focus();
      }
    }
  }

  async beforeUnload() {
    // Whatever it was writing is for a window that has gone. The weights stay
    // loaded: opening this again should not fetch a third of a gigabyte twice.
    this.stop?.abort();
  }
}

export default ChatContent;
