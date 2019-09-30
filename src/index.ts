// API: https://jobtechdev.se/swagger/#/platsannonser/fetchHTMLPlatsannons

import got from "got";
import fs from "fs";
import { DateTime } from "luxon";

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

const matches = 20;
const stockholmLanId = 1;
const searchTerm = "javascript";

const logoType = (jobId: string) =>
  `https://api.arbetsformedlingen.se/af/v0/platsannonser/${jobId}/logotyp`;

const jobUrl = (jobId: string) =>
  `https://api.arbetsformedlingen.se/af/v0/platsannonser/${jobId}`;

const exception = (error: any) => {
  console.error({
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  return process.exit(100);
};

const jobDescription = async (jobId: string) => {
  const jobResponse = await got(
    `https://api.arbetsformedlingen.se/af/v0/platsannonser/${jobId}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  ).catch(exception);

  const result = (JSON.parse(jobResponse.body) as JobDetails).platsannons.annons
    .annonstext;
  return result;
};

const main = async () => {
  const today = DateTime.utc();

  const { body } = await got(
    `https://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?lanid=${stockholmLanId}&nyckelord=${searchTerm}&sida=1&antalrader=${matches}`,

    {
      headers: {
        Accept: "application/json"
      }
    }
  ).catch(exception);

  fs.writeFileSync("output.json", body);

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
        }) => ({
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
          jobDescription: await jobDescription(annonsid)
        })
      )
  );

  fs.writeFileSync("short_infos.json", JSON.stringify(shortInfos, null, 2));
};

main();
