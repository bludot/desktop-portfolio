import OSElement from "./../../utils/OSElement";
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
  <div>
    <h2>${position}</h2>
    <h3>${company}</h3>
    
    <div class="flex">
        <div>
            <span>${format(start, "MM/yyyy")}</span> - <span>${typeof end == "string" ? end : format(end, "MM/yyyy")}</span>
        </div>
        <div>
             
            <span>${locationSVG} ${location}</span>
        </div>
    </div>
    <ul>${description.map(item => `<li>${item}</li>`).join("")}</ul>
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
        color: "#333",
        "& > div > *": {
          paddingBottom: "0.25em !important"
        },
        "& h2": {
          padding: "0",
          margin: "0",
          fontWeight: 300
        },
        "& h3": {
          padding: "0",
          margin: "0",
        },
        "& .flex": {
          display: "flex",
        },
        "& .flex > div": {
          flex: "auto 1 0"
        },
        "& .flex > div:nth-child(2)": {
          textAlign: "right"
        },
        "& ul": {
          paddingLeft:"1em"
        },
        "& ul li": {
          padding: "0.25em 0"
        },
        "& .flex svg > path": {
          fill: "#738dff"
        }
      }
    });
  }
}

export {ExperiencesContent as default, ExperienceI}
