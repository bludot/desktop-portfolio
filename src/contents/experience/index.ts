import OSElement from "./../../utils/OSElement";
import { space } from "../../theme";
import { NARROW_PX } from "../../utils/utils";
import ExperiencesContent, {type ExperienceI} from "./experiences";

const content = `
<div>
  <div class="content"></div>
</div>
`;

// Build months in local time. The ISO string form is parsed as UTC midnight
// while date-fns formats in local time, so any viewer west of Greenwich saw
// every role start a month early.
const month = (year: number, monthOfYear: number) => new Date(year, monthOfYear - 1, 1);

const experience: ExperienceI[] = [
  {
    position: "Engineering Manager",
    company: "GoTu",
    location: "Miami, FL, USA",
    description: [
      "Led the organization's Developer Productivity initiative, standardizing microservice architecture, reusable service templates, CI/CD workflows, deployment tooling, and Infrastructure as Code so engineers could build, test and deploy consistently.",
      "Led the transition from a monolith to a standardized microservices platform. My team designed and owned the majority of new services while defining the architectural patterns adopted across engineering.",
      "Modernized software delivery by replacing legacy pipelines with a GitOps container deployment strategy on GitHub Actions, Docker, Kubernetes, and ArgoCD.",
      "Spearheaded the move to Infrastructure as Code with Terraform, so AWS resources, Datadog monitors, and S3 buckets are provisioned through version-controlled workflows rather than by hand.",
      "Built a culture of operational excellence through monitoring, dashboards, alerting, and an on-call program, shifting the team from reactive incident response to proactive ownership.",
      "Introduced GrowthBook as the feature management and experimentation platform, enabling progressive rollouts and A/B testing while reducing deployment risk.",
      "Led engineering delivery of the Dual Model initiative, letting the platform support both W-2 employees and independent contractors. This removed a major scalability barrier and positioned the business for nationwide expansion.",
      "Delivered an automated credential verification platform that streamlined professional onboarding and increased the number of qualified healthcare professionals able to apply for shifts.",
      "Developed AI-assisted developer workflows using Claude to automate service generation, Helm chart creation, and ArgoCD configuration."
    ],
    start: month(2023, 10),
    end: month(2026, 7),
  },
  {
    position: "Backend Engineer",
    company: "Honest",
    location: "Bangkok, Thailand",
    description: [
      "Designed and implemented features in Go for a fintech launching a credit card in Indonesia, across Terraform, Redis, Postgres, Kafka, Grafana, Loki, Prometheus, Kubernetes, ArgoCD, AWS, GCP, and Helm.",
      "Engineered a bespoke Multi-Factor Authentication system on a proprietary, open-source authentication core, covering mobile number, facial biometrics, and OTP.",
      "Built microservices on GraphQL federation handling transactions and payments, raising transaction throughput.",
      "Developed open source libraries and Terraform modules: KP for Kafka processing with retries, an AWS IAM module, and a fully deployable Databricks environment on AWS, all adhering to Checkov checks to mitigate vulnerabilities.",
      "Reached roughly 90-95% test coverage using Go's built-in testing with Testify, and HTTPMock and Hijack for HTTP and GraphQL mocking.",
      "Introduced \"Guilds\", which streamline engineering work such as migrations to new systems, tech debt, and improvements in areas of interest."
    ],
    start: month(2021, 9),
    end: month(2023, 5),
  },
  {
    position: "Full-Stack Engineer",
    company: "Taskworld",
    location: "Bangkok, Thailand",
    description: [
      "Led development of the subtask feature, an Auth API with MFA on local and third-party logins, and Smart Tags, using Node.js, TypeScript, React, Mongoose, MongoDB, Elasticsearch, Datadog, Kubernetes, FluxCD, and Redis.",
      "Introduced full Dockerization of the development environment, improving productivity and reducing infrastructure bugs.",
      "Implemented end-to-end testing inside Docker, cutting e2e time by an hour per branch.",
      "Streamlined local environment setup, taking initialization from 10-15 minutes to a single command.",
      "Delivered technical presentations on new designs, features, and development plans."
    ],
    start: month(2020, 7),
    end: month(2021, 8),
  },
  {
    position: "Software Engineer",
    company: "Bangkok Komatsu Sales",
    location: "Bangkok, Thailand",
    description: [
      "Implemented CI/CD, established a staging environment, and introduced proper testing, adopting Agile practices to improve project management and collaboration.",
      "Deployed Docker to bare metal servers with Docker Swarm and Swarmpit, and subsequently Kubernetes.",
      "Established company-wide processes for managing projects from ideation through to deployment.",
      "Developed an e-commerce system for selling parts with Node.js, Postgres, and React, providing a digital sales channel.",
      "Worked across Node.js, TypeScript, React, TypeORM, Elasticsearch, Sentry, Kubernetes, FluxCD, Redis, and AWS."
    ],
    start: month(2019, 5),
    end: month(2020, 6),
  },
  {
    position: "Full-Stack Developer",
    company: "Selfapy GmBH",
    location: "Berlin, Germany",
    description: [
      "Spearheaded the provision of online mental health services through courses and psychologist consultations, catering to remote patient needs.",
      "Rebuilt an existing Meteor project into separate frontend and backend applications, and later into Ruby, using Node.js, MongoDB, AWS, S3, Docker, Kubernetes, Ruby, Postgres, and CircleCI.",
      "Introduced Object-Relational Mapping and improved database management, easing data migrations and issue handling.",
      "Implemented unit and visual testing with CircleCI, Cypress, nyc, Mocha, and Selenium.",
      "Dockerized our applications and served the frontend from S3, taking deployments down to around ten seconds once tests had run."
    ],
    start: month(2017, 7),
    end: month(2019, 2),
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
    start: month(2016, 9),
    end: month(2017, 4),
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
    start: month(2013, 12),
    end: month(2016, 6),
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
    start: month(2012, 11),
    end: month(2014, 5),
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
        padding: `${space.windowPadY} ${space.windowPadX}`,
        display: "block",
        // A phone cannot spare 21px of gutter on each side.
        [`@media (max-width: ${NARROW_PX}px)`]: {
          padding: "15px 14px"
        }
      },
    });
  }
}

export default ExperienceContent;
