import OSElement from "../../utils/OSElement";
import { color, font, radius, size, space, tracking, weight } from "../../theme";
import {
  CHAT_MODEL,
  CHAT_MODELS,
  gpuAvailable,
  type ChatEngine,
  type ChatModel,
  type DevicePreference,
  type Message
} from "@thatcatdev/browser-ai";
import { loadSettings, saveSettings } from "../../Store";
import {
  asksForSources,
  chat,
  contextual,
  ground,
  knowledgeDocuments,
  knowledgeIndex,
  personal,
  refuse,
  type Document
} from "../../ai";
import { loadRepos } from "../../utils/github";
import { SEARCH_URL } from "../../utils/websearch";
import { Download, remaining } from "./progress";
import { MADE_UP, SHOWN, parseQuestions, suggest } from "./suggestions";
import { prefersReducedMotion } from "../../utils/motion";

/**
 * A conversation with a model that lives on this machine.
 *
 * Nothing is loaded until this window is opened — not the library, not the
 * weights — and nothing is loaded twice: the engine is shared, so closing the
 * window and opening it again resumes with the model already warm.
 *
 * The window opens immediately and fills in, rather than sitting behind the
 * usual splash. The better part of a gigabyte is a wait somebody should be able to
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
    "You are a small language model running offline in James's portfolio desktop, inside the visitor's own browser.",
    "You cannot browse the web, search, open programs, or see the screen, and you know nothing about today: not the date, the news, prices, or what is currently airing or released.",
    "If you are asked to look something up or for anything current, say in one sentence that you cannot — never offer to search.",
    "Otherwise answer directly, in one or two short sentences.",
    "Never invent dialogue, characters, or stage directions.",
    "If you do not know something, say so plainly."
  ].join(" ")
};

type Phase = "loading" | "ready" | "failed";

/** How much of a passage to show. Enough to check the answer against. */
const EXCERPT = 240;

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
  private pip!: HTMLElement;
  private bar!: HTMLElement;
  private fill!: HTMLElement;
  private openings!: HTMLElement;
  private openingRow!: HTMLElement;
  private models!: HTMLSelectElement;
  private devices!: HTMLSelectElement;

  private phase: Phase = "loading";
  private answering = false;
  private stop?: AbortController;

  /**
   * What the model is allowed to know about James.
   *
   * Built alongside the chat model rather than before it: the weights are the
   * long pole, and the notes are 23MB the launcher may well have fetched
   * already. Nothing waits on it — a question asked before it is ready is
   * simply answered without notes.
   *
   * Passed in for the same reason the engine is: a test should be able to say
   * what this window knows without a thread and a set of weights.
   */
  private readonly knowledge: ReturnType<typeof knowledgeIndex>;

  /**
   * What the last answer was built from.
   *
   * Kept so the window can say — under the answer, and again if somebody asks
   * outright what it was based on, which is the reasonable next question when a
   * machine tells you about somebody.
   */
  private sources: Document[] = [];

  /**
   * Every question that has been put, however it was put.
   *
   * Only so the same suggestion is not offered twice: a list that keeps
   * offering what has just been answered is the tell that it is a list rather
   * than a conversation.
   */
  private readonly answered = new Set<string>();

  /**
   * Follow-ups the model wrote, after they were checked against the notes.
   *
   * Emptied the moment a new question is asked: they were about the previous
   * answer, and leaving them up under a new one is how a window ends up
   * suggesting something the conversation has moved past.
   */
  private made: string[] = [];

  /** The follow-ups being written, so a new question can abandon them. */
  private thinkingUp?: AbortController;

  /**
   * How an engine is got, rather than the engine itself.
   *
   * The picker builds a new one whenever the model or the device changes, so
   * what this window needs is the factory — which is also what makes it
   * testable without a gigabyte of weights.
   */
  private readonly makeEngine: (model: string, device: DevicePreference) => ChatEngine;

  constructor(
    makeEngine: (model: string, device: DevicePreference) => ChatEngine = chat,
    knowledge: ReturnType<typeof knowledgeIndex> = knowledgeIndex()
  ) {
    super("chatcontent", "chat-content");
    this.makeEngine = makeEngine;
    this.knowledge = knowledge;
    this.engine = makeEngine(this.choice.model, this.choice.device);

    this.style = () => ({
      // The segment that travels while a download has started but has not yet
      // reported a byte. See `.chat-progress.is-waiting`.
      "@keyframes chat-waiting": {
        from: { transform: "translateX(-40%)" },
        to: { transform: "translateX(340%)" }
      },
      // Full width, breathing: everything has arrived and the model is being
      // built out of it. See `.chat-progress.is-preparing`.
      "@keyframes chat-preparing": {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0.35 }
      },
      [this.id]: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: font.ui,
        color: color.ink,
        fontSize: size.bodyTight,

        // ------------------------------------------------------- the band
        /*
         * One row saying what is true now, with everything that is always true
         * folded behind it. The whole row is the summary, so the affordance is
         * the band rather than a word inside it.
         *
         * The band and the download bar share a container so the bar can be
         * drawn *on* the band's bottom edge rather than under it — one line that
         * fills, instead of a second line that appears and shoves the
         * conversation down a few pixels.
         */
        "& .chat-head": {
          flex: "0 0 auto",
          position: "relative",
          borderBottom: `1px solid ${color.lineSoft}`
        },
        "& .chat-band": {
          flex: "0 0 auto"
        },
        "& .chat-band summary": {
          display: "flex",
          alignItems: "center",
          gap: "9px",
          height: "32px",
          padding: `0 ${space.windowPadX}`,
          cursor: "pointer",
          listStyle: "none",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          transition: "background 150ms ease"
        },
        "& .chat-band summary::-webkit-details-marker": { display: "none" },
        "& .chat-band summary:hover": { background: color.hover },
        "& .chat-band summary:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "-2px"
        },
        /*
         * Unlit until the model is loaded and waiting. `--current` is the
         * desktop's token for "this is happening now" and is not spent on
         * anything else here.
         */
        "& .chat-pip": {
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          flex: "0 0 auto",
          background: color.line
        },
        "& .chat-pip.is-ready": {
          background: color.current,
          boxShadow: `0 0 0 3px rgba(74,124,89,.16)`
        },
        "& .chat-status": {
          margin: 0,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: color.inkSoft,
          fontVariantNumeric: "tabular-nums"
        },
        "& .chat-private, & .chat-more": {
          flex: "0 0 auto",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          padding: "1px 8px"
        },
        "& .chat-private": { marginLeft: "auto" },
        "& .chat-band[open] .chat-more": { color: color.ink },

        // -------------------------------------------------- the download
        /*
         * Two pixels along the bottom edge, and only while something is
         * arriving. A percentage in a line of text is a number to read; this is
         * a thing to glance at, which is what somebody deciding whether to wait
         * actually does.
         */
        "& .chat-progress": {
          position: "absolute",
          left: 0,
          right: 0,
          // Over the container's own hairline, not below it: the edge becomes
          // the bar rather than gaining a second one.
          bottom: "-1px",
          height: "2px",
          overflow: "hidden",
          background: color.lineSoft
        },
        "& .chat-progress[hidden]": { display: "none" },
        "& .chat-progress-fill": {
          display: "block",
          width: 0,
          height: "100%",
          background: color.accent,
          transition: "width 240ms linear"
        },
        /*
         * Before the first byte is counted there is nothing honest to fill to —
         * the connection is still opening. A segment that travels says that
         * much and no more; the moment there is a real number it stops.
         */
        "& .chat-progress.is-waiting .chat-progress-fill": {
          width: "30%",
          transition: "none",
          animation: "$chat-waiting 1.4s ease-in-out infinite"
        },
        /*
         * Full, and still working. The last byte is not the last of the wait —
         * the graph still has to be built — so the bar breathes rather than
         * standing at 100% looking hung.
         */
        "& .chat-progress.is-preparing .chat-progress-fill": {
          animation: "$chat-preparing 1.6s ease-in-out infinite"
        },
        /*
         * Nothing travels for somebody who asked for less movement. The track
         * fills faintly instead, which still separates "fetching" from
         * "nothing is happening" — the only thing this state has to say.
         */
        "& .chat-progress.is-waiting.is-still .chat-progress-fill": {
          animation: "none",
          width: "100%",
          opacity: 0.3
        },
        "& .chat-progress.is-preparing.is-still .chat-progress-fill": {
          animation: "none",
          opacity: 0.55
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .chat-progress-fill": { transition: "none" },
          "& .chat-progress.is-waiting .chat-progress-fill": {
            animation: "none",
            width: "100%",
            opacity: 0.3
          },
          "& .chat-progress.is-preparing .chat-progress-fill": {
            animation: "none",
            opacity: 0.55
          }
        },

        "& .chat-what": {
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          padding: `2px ${space.windowPadX} 12px`
        },
        "& .chat-what p": {
          margin: 0,
          fontSize: size.caption,
          lineHeight: 1.5,
          color: color.inkSoft,
          maxWidth: "52ch"
        },
        "& .chat-choices": {
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "3px"
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
         * A real `select`: the desktop draws its own everything else, but a
         * native menu is the one control that behaves on a phone.
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

        "& .chat-source": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .chat-source summary": {
          cursor: "pointer",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px"
        },
        // The default triangle is the browser's, in the browser's colour. This
        // one is a caret that turns, in ink that belongs to the theme.
        "& .chat-source summary::-webkit-details-marker": { display: "none" },
        "& .chat-source summary::before": {
          content: "'\\203A'",
          display: "inline-block",
          transition: "transform 150ms ease"
        },
        "& .chat-source[open] summary::before": { transform: "rotate(90deg)" },
        "& .chat-source summary:hover": { color: color.inkSoft },
        "& .chat-source summary:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "2px"
        },
        "& .chat-source ul": {
          margin: "7px 0 0",
          padding: "0 0 0 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        },
        "& .chat-source li": { lineHeight: 1.5 },
        "& .chat-source b": { color: color.inkSoft, fontWeight: weight.emphasise },
        "& .chat-web": {
          alignSelf: "flex-start",
          marginTop: "2px",
          padding: "5px 11px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          fontSize: size.caption,
          textDecoration: "none",
          transition: "background 150ms ease, color 150ms ease"
        },
        "& .chat-web:hover": { background: color.hover, color: color.accent },
        "& .chat-web:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },

        // -------------------------------------------------- the openings
        /*
         * Questions to click, for anybody looking at an empty box.
         *
         * They live in the transcript rather than above the input, so they sit
         * where the conversation will be and leave with it. During the
         * download they are also the only thing in the window worth reading,
         * which is most of why they are here rather than in a strip.
         */
        "& .chat-openings": {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
          paddingTop: "2px"
        },
        "& .chat-openings[hidden]": { display: "none" },
        "& .chat-openings-label": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "& .chat-openings-row": {
          display: "flex",
          flexWrap: "wrap",
          gap: "7px"
        },
        "& .chat-opening": {
          maxWidth: "100%",
          padding: "6px 12px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          textAlign: "left",
          cursor: "pointer",
          transition: "background 150ms ease, color 150ms ease, border-color 150ms ease"
        },
        "& .chat-opening:hover:not(:disabled)": {
          background: color.hover,
          color: color.accent,
          borderColor: color.accent
        },
        "& .chat-opening:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        // Offered while the weights are still arriving, because reading them is
        // something to do with the wait — but not clickable until there is
        // something to answer with.
        "& .chat-opening:disabled": { opacity: 0.45, cursor: "default" },

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
    const head = document.createElement("div");
    head.className = "chat-head";
    head.append(this.band(), this.progress());
    this.element.appendChild(head);

    this.log = document.createElement("div");
    this.log.className = "chat-log";
    // Answers arrive a word at a time, and a screen reader should hear them
    // when they settle rather than on every token.
    this.log.setAttribute("role", "log");
    this.log.setAttribute("aria-live", "polite");
    this.element.appendChild(this.log);
    this.openings = this.buildOpenings();
    this.offer();

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
    /*
     * Somebody with a question of their own does not need three of ours in the
     * way. They come back if the box is emptied again — deciding not to type
     * is exactly when they are wanted.
     */
    this.input.addEventListener("input", () => this.offer());

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
  /**
   * One band, saying what is true now.
   *
   * It replaces a four-clause disclaimer welded together with middots and a
   * separate row of controls — ninety-two pixels of chrome above a window whose
   * job is a conversation. What is left is the part that actually changes:
   * which model, where it is running, and that nothing is leaving the tab.
   *
   * The caveats have not gone anywhere; they are one press away, alongside the
   * controls that change them. A warning is urgent exactly once — before the
   * first question — and by the tenth it is furniture.
   */
  private band(): HTMLElement {
    const box = document.createElement("details");
    box.className = "chat-band";

    const summary = document.createElement("summary");

    this.pip = document.createElement("span");
    this.pip.className = "chat-pip";
    this.pip.setAttribute("aria-hidden", "true");
    summary.appendChild(this.pip);

    this.status = document.createElement("p");
    this.status.className = "chat-status";
    // Polite: this line changes while somebody is reading the answer above it.
    this.status.setAttribute("role", "status");
    summary.appendChild(this.status);

    const priv = document.createElement("span");
    priv.className = "chat-private";
    // The one claim a visitor cannot check and would most like to know, said as
    // a state rather than as an argument.
    priv.appendChild(document.createTextNode("private"));
    summary.appendChild(priv);

    const more = document.createElement("span");
    more.className = "chat-more";
    more.appendChild(document.createTextNode("what is this?"));
    summary.appendChild(more);

    box.appendChild(summary);

    const body = document.createElement("div");
    body.className = "chat-what";
    /*
     * Three sentences, not one line with three middots in it. Said in the first
     * person because it is the thing itself saying so, which is both more
     * alarming and more honest than describing it in the third.
     */
    [
      "It runs on your machine — nothing you type leaves this tab.",
      "It can't look anything up: no internet, and no idea what today is.",
      "It's half a billion parameters. It invents things, confidently."
    ].forEach((line) => {
      const p = document.createElement("p");
      p.appendChild(document.createTextNode(line));
      body.appendChild(p);
    });
    body.appendChild(this.picker());
    box.appendChild(body);

    return box;
  }

  /**
   * The questions on offer, and the row they live in.
   *
   * One element, moved to the end of the transcript each time it is filled, so
   * the offer always sits under the last thing said rather than at the top of a
   * conversation that has moved on.
   */
  private buildOpenings(): HTMLElement {
    const box = document.createElement("div");
    box.className = "chat-openings";

    const label = document.createElement("span");
    label.className = "chat-openings-label";
    label.appendChild(document.createTextNode("Try asking"));
    box.appendChild(label);

    this.openingRow = document.createElement("div");
    this.openingRow.className = "chat-openings-row";
    // A group rather than a list: these are controls, and a screen reader
    // should be told what the set of them is for before reading eleven words
    // of the first one.
    this.openingRow.setAttribute("role", "group");
    this.openingRow.setAttribute("aria-label", "Suggested questions");
    box.appendChild(this.openingRow);

    return box;
  }

  /**
   * Put the next few questions up, or take them away.
   *
   * Away when somebody is typing — they have their own question and ours are
   * in the way — and away for good once there is nothing left unasked.
   */
  private offer() {
    const typing = this.input?.value.trim().length > 0;
    const next = typing
      ? []
      : suggest(this.answered, this.sources.map((p) => p.source), SHOWN, this.made);

    this.openingRow.textContent = "";
    next.forEach((question) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-opening";
      // Offered while the weights are still coming, so there is something to
      // read during the wait; clickable only once there is an answer to give.
      chip.disabled = this.phase !== "ready";
      chip.appendChild(document.createTextNode(question));
      chip.addEventListener("click", () => {
        this.input.value = question;
        this.form.requestSubmit();
      });
      this.openingRow.appendChild(chip);
    });

    this.openings.hidden = !next.length;
    // To the end, under whatever was said last.
    if (next.length) this.log.appendChild(this.openings);
  }

  /**
   * Ask the model what somebody might want to know next.
   *
   * Better than a fixed list can be, because it has just read the passages the
   * answer came from and a list has not — and worse than a fixed list in the
   * one way that matters, which is that at this size it will happily invent a
   * question about a James who does not exist. So nothing it writes is offered
   * until retrieval has found something to answer it with: see `answerable`.
   *
   * In the background, after the answer. Nobody waits on a suggestion, and on
   * a CPU this is another few seconds of generation.
   */
  private async imagine(found: Document[]) {
    if (!found.length) return;

    this.thinkingUp?.abort();
    const mine = new AbortController();
    this.thinkingUp = mine;

    /*
     * Its own exchange, not a turn in the conversation. Asked as part of the
     * transcript, the request to write questions becomes something the model
     * answers *again* two questions later — and the person reading it never
     * asked for questions at all.
     */
    /*
     * The rules earn their place, each one against a way this failed.
     *
     * Without a length, it writes "How did James contribute to the development
     * of innovative technologies and methodologies?" — ninety characters of
     * nothing, and no chip that size fits anywhere. Without "name something
     * from the notes" it asks about innovation and impact rather than about
     * Terraform. And asked for the questions with no other instruction it
     * numbers them, so the numbers come off again on the way back.
     */
    const asked: Message[] = [
      {
        role: "user",
        content: [
          "Notes about James:",
          found.map((passage) => passage.text).join("\n"),
          "",
          `Write ${MADE_UP} questions a reader might ask next about James, one per line.`,
          "Rules: each under 10 words. Each must name something from the notes — a company, a tool, or a project. No numbering, no preamble."
        ].join("\n")
      }
    ];

    try {
      const written = await this.engine.reply(asked, () => {}, mine.signal);
      if (mine.signal.aborted || mine !== this.thinkingUp) return;

      const kept: string[] = [];
      for (const question of parseQuestions(written)) {
        if (this.answered.has(question)) continue;
        if (await this.answerable(question)) kept.push(question);
      }
      if (mine.signal.aborted || mine !== this.thinkingUp) return;

      this.made = kept;
      this.logger.debug(`follow-ups kept ${kept.length}: ${kept.join(" | ")}`);
      if (!this.answering) this.offer();
    } catch (error) {
      // A suggestion nobody asked for is not worth reporting. The written-down
      // questions are still there.
      this.logger.debug(`follow-ups failed: ${error}`);
    }
  }

  /**
   * Whether there is anything here to answer a question with.
   *
   * The whole guard against a small model's inventions: it can write "What did
   * James do at Spotify?" out of nothing, and retrieval will find nothing above
   * the floor for it, and it is never offered. It proves only that something
   * related exists — which is exactly the claim being made by putting it up.
   */
  private async answerable(question: string): Promise<boolean> {
    if (!this.knowledge.ready) return false;
    try {
      return (await this.knowledge.search(question)).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * The download, as a line rather than as a number.
   *
   * It is a `progressbar` and not a decoration: the percentage is in the status
   * text above it, but that text is one line in a band somebody may never look
   * at twice, and a screen reader should be able to ask how far along this is
   * rather than wait to be told.
   */
  private progress(): HTMLElement {
    this.bar = document.createElement("div");
    this.bar.className = "chat-progress";
    this.bar.setAttribute("role", "progressbar");
    this.bar.setAttribute("aria-label", "Downloading the model");
    this.bar.setAttribute("aria-valuemin", "0");
    this.bar.setAttribute("aria-valuemax", "100");

    this.fill = document.createElement("span");
    this.fill.className = "chat-progress-fill";
    this.bar.appendChild(this.fill);

    return this.bar;
  }

  /**
   * Show the bar at a fraction, or hide it entirely.
   *
   * `undefined` is not zero: before anything has been counted there is no
   * honest length to draw, so the bar says "something is happening" instead of
   * claiming nought per cent. Hidden once there is nothing left to wait for —
   * a finished bar is just a line.
   */
  private drawProgress(fraction?: number, preparing = false) {
    this.bar.classList.toggle("is-still", prefersReducedMotion());
    if (fraction === undefined) {
      this.bar.classList.add("is-waiting");
      this.bar.classList.remove("is-preparing");
      this.bar.removeAttribute("aria-valuenow");
      this.fill.style.width = "";
      return;
    }

    const percent = Math.round(fraction * 100);
    this.bar.setAttribute("aria-valuenow", String(percent));
    /*
     * A bar of no width is indistinguishable from a broken one, and the first
     * seconds of any of these downloads are spent on files too small to move
     * it. So it keeps travelling until there is a percent to show.
     */
    this.bar.classList.toggle("is-waiting", percent < 1);
    // Full, and still working: the bytes are all in and the model is being
    // built out of them. A static full bar is where somebody gives up.
    this.bar.classList.toggle("is-preparing", preparing);
    if (percent >= 1) this.fill.style.width = `${percent}%`;
  }

  private picker(): HTMLElement {
    const row = document.createElement("div");
    row.className = "chat-choices";

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
    (
      [
        ["auto", "Automatic"],
        ["webgpu", "GPU"],
        ["wasm", "CPU"]
      ] as const
    ).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = label;
      this.devices.appendChild(option);
    });

    /*
     * Whether the GPU is really on offer takes a round trip to the driver, so
     * the menu is drawn first and corrected a moment later.
     *
     * It has to be the adapter and not `navigator.gpu`: Chrome ships the API
     * and then refuses an adapter on a range of older Intel parts and Linux
     * drivers, which is how somebody selects "GPU" and is told the model could
     * not be loaded at all. Offered-but-disabled, with the reason on it, beats
     * both hiding it and letting it fail.
     */
    void gpuAvailable().then((available) => {
      const auto = this.devices.options[0];
      const gpu = this.devices.options[1];
      auto.text = available ? "Automatic (GPU)" : "Automatic (CPU)";
      if (!available) {
        gpu.text = "GPU — not available here";
        gpu.disabled = true;
      }
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
  /**
   * Gather what there is to know about James, and learn it.
   *
   * The repositories are optional — GitHub may be unreachable — but everything
   * about his own history is local, so the useful half never depends on the
   * network. Nothing waits on this: a question asked before it lands is
   * answered without notes rather than made to wait.
   */
  private async learn() {
    let repos: Awaited<ReturnType<typeof loadRepos>>["repos"] = [];
    try {
      repos = (await loadRepos()).repos;
    } catch {
      // Answerable without them, just not about the code.
    }
    await this.knowledge.build(knowledgeDocuments(repos));
    this.logger.debug(`notes ready: ${this.knowledge.ready}`);
  }

  private async warm() {
    const chosen = CHAT_MODELS.find((m: ChatModel) => m.id === this.choice.model);
    const size = chosen ? chosen.size : "a few hundred MB";
    /*
     * The whole price, said before any of it has been paid: the size, and that
     * it is paid once. Everything after this is arithmetic on top of it, so it
     * gets said while somebody is still deciding whether to wait.
     */
    this.say(`Downloading the model… ${size}, once, then it is cached.`);
    // Back from the start, since this also runs when somebody changes model
    // halfway through a conversation.
    this.bar.hidden = false;
    this.drawProgress();
    /*
     * Measured against what this model actually weighs, not against the bytes
     * the runtime has admitted to so far — which, for the first seconds, is a
     * tokenizer. See `Download`.
     */
    const download = new Download(chosen?.bytes);
    try {
      await this.engine.load((_fraction, detail) => {
        const { fraction, eta, preparing } = download.record(
          detail.loaded,
          detail.total
        );
        const percent = Math.round(fraction * 100);
        this.drawProgress(fraction, preparing);
        /*
         * Between the last byte and the first answer there is a real wait —
         * the weights are read, the graph is built, and on a CPU that is
         * seconds of arithmetic with nothing to report. Said plainly, because
         * a bar sitting at 100% with no explanation is the moment somebody
         * decides the page is broken.
         */
        if (preparing) {
          this.say("Downloaded. Building the model — this takes a few seconds…");
          return;
        }
        /*
         * The estimate is left off until it is worth trusting — see
         * `Download` — and the size goes when it arrives. The band is one line
         * in a window somebody may have made narrow; the size was already said
         * in full before any of this, and between "of ~185MB" and "about 20s
         * left" the second is what a person waiting actually wants.
         */
        this.say(
          eta === undefined
            ? `Downloading… ${percent}% of ${size}, then cached`
            : `Downloading… ${percent}% · ${remaining(eta)}`
        );
      });
      this.phase = "ready";
      this.bar.hidden = true;
      this.bar.classList.remove("is-waiting", "is-preparing");
      /*
       * The model's own name rather than "0.5B parameters": it is searchable,
       * and it is what somebody would tell a friend they had been using.
       */
      const named = CHAT_MODELS.find((m: ChatModel) => m.id === this.choice.model);
      const where = this.engine.device === "webgpu" ? "GPU" : "CPU";
      this.say(
        this.engine.fellBackToCpu
          ? `${named?.label ?? "Ready"} · CPU — no WebGPU here`
          : `${named?.label ?? "Ready"} · ${where}`,
        true
      );
      this.input.disabled = false;
      this.send.disabled = false;
      // The openings were readable through the download; now they work.
      this.offer();
      this.input.focus();
      // In the background: a question asked before it lands is answered
      // without notes rather than made to wait.
      void this.learn();
    } catch (error) {
      this.phase = "failed";
      this.bar.hidden = true;
      this.say(
        "The model could not be loaded here — usually an old browser, or no room left to cache it."
      );
      this.logger.debug(`chat model failed: ${error}`);
    }
  }

  /**
   * What the band says, and whether the light beside it is on.
   *
   * `--current` is the desktop's token for "this is happening now", and a model
   * loaded and waiting is exactly that. Anything else — downloading, thinking,
   * failed — leaves it unlit rather than inventing a second colour.
   */
  private say(text: string, ready = this.phase === "ready") {
    this.status.textContent = text;
    this.pip.classList.toggle("is-ready", ready);
  }

  /** Back to naming the model, once it has finished answering. */
  private ready() {
    const named = CHAT_MODELS.find((m: ChatModel) => m.id === this.choice.model);
    const where = this.engine.device === "webgpu" ? "GPU" : "CPU";
    this.say(`${named?.label ?? "Ready"} · ${where}`, true);
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

    this.log.appendChild(turn);
    this.log.scrollTop = this.log.scrollHeight;
    return said;
  }

  /**
   * The desktop can search even though the model cannot.
   *
   * A link rather than a sentence about how one might search: the question is
   * already typed, and the only thing standing between somebody and an answer
   * is a click. Opened in a tab because no search engine allows itself to be
   * framed — see the launcher, which has the same constraint.
   */
  private webSearch(query: string): HTMLElement {
    const link = document.createElement("a");
    link.className = "chat-web";
    link.href = SEARCH_URL + encodeURIComponent(query);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(document.createTextNode(`Search the web for “${query}” ↗`));
    return link;
  }

  /**
   * Where an answer came from.
   *
   * The difference between "the machine said so" and something checkable — and
   * on a window whose whole claim is that it is not making things up, the
   * receipts are the claim. Sources rather than a count: "Engineering Manager
   * at GoTu" is a fact about the answer; "3 passages" is a fact about the
   * implementation.
   */
  private citation(found: Document[]): HTMLElement {
    const box = document.createElement("details");
    box.className = "chat-source";

    const summary = document.createElement("summary");
    const seen = [...new Set(found.map((passage) => passage.source))];
    summary.appendChild(document.createTextNode(`from ${seen.join(" · ")}`));
    box.appendChild(summary);

    /*
     * The sentences themselves, not a reference to them.
     *
     * A label alone still asks somebody to trust that the label matched — the
     * excerpt is what lets them see the answer was a paraphrase and not an
     * invention. Closed by default, because the answer is the thing being read
     * and this is the working underneath it.
     */
    const list = document.createElement("ul");
    found.forEach((passage) => {
      const item = document.createElement("li");

      const where = document.createElement("b");
      where.appendChild(document.createTextNode(passage.source));
      item.appendChild(where);

      const text =
        passage.text.length > EXCERPT
          ? `${passage.text.slice(0, EXCERPT).trimEnd()}…`
          : passage.text;
      item.appendChild(document.createTextNode(` ${text}`));
      list.appendChild(item);
    });
    box.appendChild(list);

    return box;
  }

  private async ask() {
    const question = this.input.value.trim();
    if (!question || this.phase !== "ready" || this.answering) return;

    this.input.value = "";
    this.answered.add(question);
    /*
     * Whatever the model was writing was about the previous answer. Abandoned
     * rather than shown late, which is how a window ends up suggesting
     * something the conversation has moved past.
     */
    this.thinkingUp?.abort();
    this.made = [];
    // Out of the way while this one is answered; back underneath the answer.
    this.openings.hidden = true;
    this.turn("You", question);
    this.history.push({ role: "user", content: question });

    /*
     * Some questions never reach the model.
     *
     * It cannot search, and it does not know what day it is — but told so in
     * its prompt it still agreed to search, and invented an anime when asked
     * what was airing. So the honest answer is given here, with the desktop's
     * own search offered underneath it.
     */
    /*
     * "What was that based on?" is about the conversation, not about James.
     * Retrieval cannot tell the difference — it fired on it, handed over the
     * same notes, and the model repeated its previous answer instead of
     * sourcing it. The window knows what it used, so the window answers.
     */
    if (asksForSources(question)) {
      const answer = this.sources.length
        ? `That came from ${[...new Set(this.sources.map((p) => p.source))].join(
            ", "
          )} — James's own experience and project notes, which this window keeps locally.`
        : "Nothing in particular — there were no notes on that, so it was the model's own words. Treat it as unreliable.";
      this.turn("Model", answer);
      this.history.push({ role: "assistant", content: answer });
      this.offer();
      this.input.focus();
      return;
    }

    const refusal = refuse(question);
    if (refusal) {
      const said = this.turn("Model", refusal.answer);
      if (refusal.search) said.parentElement?.appendChild(this.webSearch(refusal.search));
      this.history.push({ role: "assistant", content: refusal.answer });
      this.offer();
      this.input.focus();
      return;
    }

    this.answering = true;
    this.input.disabled = true;
    this.send.disabled = true;
    this.say("Thinking…", false);

    const said = this.turn("Model", "");
    said.parentElement?.classList.add("is-writing");
    this.stop = new AbortController();

    try {
      /*
       * The question, with whatever is known about it above it.
       *
       * Only in the request: the transcript keeps the plain question, so the
       * notes are not carried forward turn after turn until they crowd out the
       * conversation.
       */
      /*
       * Searched with the previous question carried forward, answered with
       * only what was typed. See `contextual`: a follow-up is about the subject
       * before it, but the model should not be handed a question nobody asked.
       */
      const previous = [...this.history]
        .reverse()
        .find((turn) => turn.role === "user" && turn.content !== question);
      const found = (
        await this.knowledge.search(contextual(question, previous?.content))
      ).map((match) => match.document);
      this.sources = found;
      this.logger.debug(
        `grounded with ${found.length}: ${found.map((p) => p.source).join(" | ")}`
      );
      const asked: Message[] = [
        ...this.history.slice(0, -1),
        {
          role: "user",
          content: ground(question, found, {
            heading: "Notes about James:",
            instruction: "Using the notes above, answer briefly:",
            // Only when the notes were the only thing that could have answered.
            whenEmpty: personal(question) ? "say-unknown" : "ask-anyway"
          })
        }
      ];

      const answer = await this.engine.reply(
        asked,
        (token) => {
          said.textContent += token;
          this.log.scrollTop = this.log.scrollHeight;
        },
        this.stop.signal
      );
      // A model that answered in one piece rather than in tokens.
      if (!said.textContent) said.textContent = answer;
      this.history.push({ role: "assistant", content: said.textContent ?? "" });
      if (found.length) said.parentElement?.appendChild(this.citation(found));
      this.ready();
      // Written questions go up straight away in the `finally` below; these
      // replace them if and when they arrive, and pass a check first.
      void this.imagine(found);
    } catch (error) {
      said.textContent = said.textContent || "It stopped partway through.";
      this.logger.debug(`chat failed: ${error}`);
      this.ready();
    } finally {
      said.parentElement?.classList.remove("is-writing");
      this.answering = false;
      this.stop = undefined;
      if (this.phase === "ready") {
        this.input.disabled = false;
        this.send.disabled = false;
        // Under the answer, and about what it was about — see `suggest`.
        this.offer();
        this.input.focus();
      }
    }
  }

  async beforeUnload() {
    // Whatever it was writing is for a window that has gone. The weights stay
    // loaded: opening this again should not fetch the better part of a
    // gigabyte twice.
    this.stop?.abort();
    this.thinkingUp?.abort();
  }
}

export default ChatContent;
