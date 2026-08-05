import OSElement from "./../../utils/OSElement";
import { color, font, size, tracking, weight } from "../../theme";
import {format } from 'date-fns'

interface ExperienceI {
  position: string
  company: string
  location: string
  description: string[]
  start: Date
  end: Date | string
}

/**
 * How long a role lasted, counted the way a CV counts it.
 *
 * Both end months are included — Oct 2023 to Jul 2026 is thirty-four months,
 * not thirty-three — because that is what everyone else means by it, and a
 * duration a month shorter than the one on his CV would look like a mistake.
 *
 * An open-ended role is measured to today.
 */
export function duration(
  start: Date,
  end: Date | string,
  now: Date = new Date()
): string {
  const finish = typeof end === "string" ? now : end;
  const months =
    (finish.getFullYear() - start.getFullYear()) * 12 +
    (finish.getMonth() - start.getMonth()) +
    1;

  if (months < 1) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];

  if (years) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

const content = ({
                   position,
                   company,
                   location,
                   description,
                   start,
                   end
                 }: ExperienceI) => `
  <div class="entry">
    <div class="entry-meta">
      <h2 class="entry-company">${company}</h2>
      <p class="entry-role">${position}</p>
      <p class="entry-dates">${format(start, "MM/yyyy")} &rarr; ${typeof end == "string" ? end : format(end, "MM/yyyy")}</p>
      <p class="entry-length">${duration(start, end)}</p>
      ${typeof end == "string" ? `<p class="entry-now">Current</p>` : ``}
    </div>
    <div class="entry-detail">
      <ul>${description.map(item => `<li>${item}</li>`).join("")}</ul>
      <p class="entry-where">${location}</p>
    </div>
  </div>
    
`

class ExperiencesContent extends OSElement {
  constructor(experience: ExperienceI) {
    super(`experiencecomponent`, `experience-component`);
    const element: HTMLElement = new DOMParser().parseFromString(
      content(experience),
      "text/html"
    ).body.childNodes[0] as HTMLElement;
    this.element.appendChild(element);
    this.style = () => ({
      [this.id]: {
        color: color.ink,
        fontFamily: font.ui,
        // Two columns: who and when on the left, what on the right.
        "& > .entry": {
          display: "grid",
          gridTemplateColumns: "148px 1fr",
          gap: "22px",
          padding: "15px 0",
          borderTop: `1px solid ${color.lineSoft}`
        },
        "& > .entry:first-child": {
          borderTop: "0",
          paddingTop: "2px"
        },
        "& .entry-meta": {
          display: "flex",
          flexDirection: "column",
          gap: "2px"
        },
        // Company leads at 600. It used to be an h3 under a lighter, larger
        // role, which read as though the job title was the employer.
        "& .entry-company": {
          margin: "0",
          padding: "0",
          fontSize: size.heading,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading,
          lineHeight: 1.25
        },
        "& .entry-role": {
          margin: "0",
          padding: "0",
          fontSize: size.small,
          color: color.inkSoft,
          lineHeight: 1.35
        },
        "& .entry-dates": {
          margin: "3px 0 0",
          padding: "0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          fontVariantNumeric: "tabular-nums"
        },
        // Sits under the dates rather than beside them: together they run past
        // the width of the column the meta gets.
        "& .entry-length": {
          margin: "1px 0 0",
          padding: "0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          fontVariantNumeric: "tabular-nums"
        },
        "& .entry-now": {
          alignSelf: "flex-start",
          margin: "5px 0 0",
          padding: "1px 5px",
          fontFamily: font.mono,
          fontSize: "9.5px",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: color.current,
          border: `1px solid ${color.current}`,
          borderRadius: "3px"
        },
        "& .entry-detail ul": {
          margin: "0",
          paddingLeft: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        },
        "& .entry-detail li": {
          padding: "0",
          fontSize: size.bodyTight,
          lineHeight: 1.55
        },
        "& .entry-detail li::marker": {
          color: color.inkFaint
        },
        "& .entry-where": {
          margin: "9px 0 0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .entry-where svg > path": {
          fill: color.inkFaint
        },
        /*
         * A 148px column for the company plus prose beside it leaves about
         * twenty characters a line once the window is narrow. Below the
         * threshold the entry stacks, and the role, dates and badge run
         * together under the company so stacking costs one line, not three.
         *
         * Keyed to the window's own width, so dragging a window narrow on a
         * big monitor reflows it just as a phone would.
         */
        ".is-narrow & > .entry": {
          gridTemplateColumns: "1fr",
          gap: "9px",
          padding: "13px 0"
        },
        ".is-narrow & .entry-meta": {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "3px 9px"
        },
        ".is-narrow & .entry-company": { flex: "0 0 100%" },
        ".is-narrow & .entry-dates": { margin: "0" },
        ".is-narrow & .entry-length": { margin: "0" },
        ".is-narrow & .entry-now": { margin: "0" },
        ".is-narrow & .entry-detail ul": { paddingLeft: "15px", gap: "7px" },
        ".is-narrow & .entry-where": { margin: "8px 0 0" }
      }
    });
  }
}

export {ExperiencesContent as default}
export type {ExperienceI}
