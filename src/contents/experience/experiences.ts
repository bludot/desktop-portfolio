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
        }
      }
    });
  }
}

export {ExperiencesContent as default}
export type {ExperienceI}
