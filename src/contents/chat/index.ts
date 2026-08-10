import OSElement from "../../utils/OSElement";
import { color, font, radius, size, space, tracking, weight } from "../../theme";
import { chatEngine, type ChatEngine, type Message } from "../../ai/chat";

/**
 * A conversation with a model that lives on this machine.
 *
 * Nothing is loaded until this window is opened — not the library, not the
 * weights — and nothing is loaded twice: the engine is shared, so closing the
 * window and opening it again resumes with the model already warm.
 *
 * The window opens immediately and fills in, rather than sitting behind the
 * usual splash. A hundred megabytes is a wait somebody should be able to watch
 * and change their mind about, and a cover with a spinner says less than a
 * percentage does. That is also why the first thing in the transcript is what
 * this is: a 135M-parameter model, running here, which writes fluent sentences
 * and invents facts. Better said at the top than discovered at the third
 * question.
 */

/** What the model is told it is, before anybody types. */
const SYSTEM: Message = {
  role: "system",
  content:
    "You are a small assistant running locally in a web browser, inside James's portfolio desktop. Answer briefly and plainly. If you do not know something, say so rather than guessing."
};

type Phase = "loading" | "ready" | "failed";

class ChatContent extends OSElement {
  private readonly engine: ChatEngine;
  private history: Message[] = [SYSTEM];

  private log!: HTMLElement;
  private form!: HTMLFormElement;
  private input!: HTMLTextAreaElement;
  private send!: HTMLButtonElement;
  private status!: HTMLElement;

  private phase: Phase = "loading";
  private answering = false;
  private stop?: AbortController;

  constructor(engine: ChatEngine = chatEngine()) {
    super("chatcontent", "chat-content");
    this.engine = engine;

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
    what.appendChild(document.createTextNode("135M parameters, running here"));
    note.appendChild(what);
    note.appendChild(
      document.createTextNode(
        "· nothing is sent anywhere · it writes well and makes things up"
      )
    );
    this.element.appendChild(note);

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

  async load(element: HTMLElement) {
    await super.load(element);
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
    this.say("Downloading the model… this happens once, then it is cached.");
    try {
      await this.engine.load((fraction) => {
        const percent = Math.round(fraction * 100);
        this.say(
          percent >= 100
            ? "Starting it up…"
            : `Downloading the model… ${percent}% · this happens once, then it is cached.`
        );
      });
      this.phase = "ready";
      this.say(
        `Ready${this.engine.device === "webgpu" ? ", on the GPU" : ", on the CPU"}. Say something.`
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
    // loaded: opening this again should not fetch a hundred megabytes twice.
    this.stop?.abort();
  }
}

export default ChatContent;
