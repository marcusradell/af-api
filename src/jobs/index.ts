// API:https://jobtechdev.se/swagger/#/platsannonser/fetchHTMLPlatsannons

// Want to use: https://jobstream.api.jobtechdev.se/

import got from "got";
import { DateTime } from "luxon";
import { jobDescriptionFactory } from "./job_description";

interface JobDetails {
  platsannons: {
    annons: {
      annonstext: string;
    };
  };
}

interface JobMatchData {
  annonsrubrik: string;
  arbetsplatsnamn: string;
  relevans: number;
  annonsid: string;
  annonsurl: string;
  sista_ansokningsdag: string;
}

interface JobMatches {
  matchningslista: {
    matchningdata: JobMatchData[];
  };
}

const casinoList = ["Gears Of Leo AB"];

const blackList = [...casinoList];

const page = 1;
const stockholmLanId = 1;
const searchTerm = "javascript";

const logoType = (jobId: string) =>
  `https://api.arbetsformedlingen.se/af/v0/platsannonser/${jobId}/logotyp`;

const exception = (error: any) => {
  console.error({
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  return process.exit(100);
};

const jobDescriptionModel = jobDescriptionFactory().model;

export const jobs = async (matches: number) => {
  const today = DateTime.utc();

  const { body } = await got(
    `https://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?lanid=${stockholmLanId}&nyckelord=${searchTerm}&sida=${page}&antalrader=${matches}`,

    {
      headers: {
        Accept: "application/json"
      }
    }
  ).catch(exception);

  const jobMatches: JobMatches = JSON.parse(body);

  const shortInfos = await Promise.all(
    jobMatches.matchningslista.matchningdata
      .filter(
        ({ sista_ansokningsdag }) =>
          DateTime.fromISO(sista_ansokningsdag) >= today
      )
      .filter(({ arbetsplatsnamn }) => !blackList.includes(arbetsplatsnamn))
      .map(
        async ({
          annonsid,
          annonsrubrik,
          arbetsplatsnamn,
          relevans,
          sista_ansokningsdag,
          annonsurl
        }) => {
          const jobDescription = await jobDescriptionModel
            .getJobDescription(annonsid)
            .then(result => {
              if (result.status === "exceptioned") {
                console.error(result.error);
                return "Can't show job description.";
              }
              return result.jobDetails;
            });

          return {
            annonsid,
            annonsurl,
            annonsrubrik,
            arbetsplatsnamn,
            relevans,
            sista_ansokningsdag,
            daysLeft: DateTime.fromISO(sista_ansokningsdag)
              .diff(today, ["days", "hours"])
              .toObject().days,
            logotype: logoType(annonsid),
            jobDescription
          };
        }
      )
  );

  return shortInfos;
};
