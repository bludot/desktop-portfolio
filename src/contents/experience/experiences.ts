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

const locationSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z"/></svg>`

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
      <p class="entry-where">${locationSVG} ${location}</p>
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
