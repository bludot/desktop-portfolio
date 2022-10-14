import OSElement from "./../../utils/OSElement";
import ExperiencesContent, {ExperienceI} from "./experiences";

const content = `
<div>
  <h1>Experience</h1>
  <div class="content"></div>
</div>
`;

const experience: ExperienceI[] = [
  {
    position: "Backend Engineer",
    company: "Honest",
    location: "Bangkok, Thailand",
    description: [
      "Build MFA system which handles stateless management of challenges to lead to authenticating a user or action.",
      "Build new microservices on Graphql federation in areas of handling transactions, payments.",
      "Develop open source libraries and terraform modules, such as KP (kafka processing with retries), databricks module to deploy entire databricks into AWS, aws-iam AWS module for handling iam related tasks while ensuring checkov checks are followed to minimize vulnerabilities.",
      "Introduced \"Guilds\" which streamline a process for doing engineering tasks such as migrations to new systems, tech debt, and improvements on areas of interest"
    ],
    start: new Date("2021-08-01"),
    end: "present"
  },
  {
    position: "Full-Stack Engineer",
    company: "Taskworld",
    location: "Bangkok, Thailand",
    description: [
      "Lead backend on subtask feature.",
      "Lead on Auth API project for the backend to bring MFA features on local login and third-party logins.",
      "Lead on Smart-tags system to bring dynamic tags.",
      "Introduce e2e inside docker as well as contained tests both in Jenkins, and Circleci.",
      "Introduce full dockerization in the dev environment to increase productivity and reduce infrastructure bugs.",
      "Improve team performance by improving agile meetings with a focus on value. (less meatings, more value in meetings)"
    ],
    start: new Date("2020-07-01"),
    end: new Date("2021-08-01"),
  },
  {
    position: "Software Engineer",
    company: "Bangkok Komatsu Sales",
    location: "Bangkok, Thailand",
    description: [
      "Introduced CI/CD, Staging environment, and proper testing as well as processes for Agile Development.",
      "Set up docker deployments to bare metal server with docker swarm and swarmpit and later Kubernetes.",
      "Setup processes for managing company projects and development (from idea to deployment).",
      "Development of an E-commerce system to sell parts using nodeJS, Postgres, ReactJS."
    ],
    start: new Date("2019-05-01"),
    end: new Date("2021-06-01"),
  },
  {
    position: "Full-Stack Developer",
    company: "Selfapy GmBH",
    location: "Berlin, Germany",
    description: [
      "Rebuild a meteor project into separate frontend and backend projects and later into ruby apps. Utilizing Nodejs, MongoDB, AWS, S3, Docker, Kubernetes, Ruby, Postgres, CicleCI.",
      "Introduce ORM and proper database management. This improved data migrations and a clearer view of our data which enabled the company to handle data issues more swiftly.",
      "Build unit testing and visual testing using CircleCI, Cypress, nyc, Mocha, and Selenium.",
      "Dockerize our applications and utilize s3 for our frontend. This sped up deployments up to 10 seconds (after tests have run) and sped up our tests.",
      "Create more minor services such as a Typeform replacement.",
    ],
    start: new Date("2017-07-01"),
    end: new Date("2019-02-01"),
  },
  {
    position: "Full-Stack Developer",
    company: "Xertigo, LLC",
    location: "Boca Raton, FL, USA",
    description: [
      "Work on frontend and backend for Quick Base module utitlizing Elastic Search, Nodejs, and Redis.",
      "QBP Project: Extend Quickbase by creating deployable apps that allow modifications to data.",
      "Generate a fast responsive frontend using react by minimizing the size of ajax calls and client side processes that slow down the interface.",
      "Decrease wait time of user from 3 min initial load to < 5 seconds due to a max of 15kb ajax responses."
    ],
    start: new Date("2016-09-01"),
    end: new Date("2017-04-01"),
  },
  {
    position: "Technical Assistant",
    company: "Florida Atlantic University",
    location: "Boca Raton, FL, USA",
    description: [
      "Manage IT equipment for CDC and manage the website. Later Join the main IT department and develop a mobile app to manage equipment.",
      "Using the college CMS build pages and web applications such as calendar, success story, sponsorship application, html enews, majorknowledge design, what can I do with this major design.",
      "Introduce ticket system to CDC department for handling requests."
    ],
    start: new Date("2013-12-01"),
    end: new Date("2016-06-01"),
  },
  {
    position: "Web Developer",
    company: "Palm Beach Hurricane Windows",
    location: "Palm Beach, FL, USA",
    description: [
      "Redesign and build company website using wordpress.",
      "Maintain any updates or changes to the website.",
      "Provide consultation on changes",
    ],
    start: new Date("2012-11-01"),
    end: new Date("2014-05-01"),
  }
]



class ExperienceContent extends OSElement {
  constructor() {
    super("experiencecontent", "experience-content");
    const element: HTMLElement = new DOMParser().parseFromString(
      content,
      "text/html"
    ).body.childNodes[0] as HTMLElement;
    const loader = element.querySelector(".content") as HTMLElement
    const experiences: ExperienceContent[] = experience.map(experience => new ExperiencesContent(experience))
    experiences.forEach(experience => experience.load(loader))

    this.element.appendChild(element);
    this.style = () => ({
      [this.id]: {
        padding: "1em 1em",
        display: "block",
        "& > div > h1": {
          marginTop: 0
        }
      },
    });
  }
}

export default ExperienceContent;
