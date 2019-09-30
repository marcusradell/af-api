import got from "got";
import fs from "fs";
import { DateTime } from "luxon";

interface JobMatchData {
  annonsrubrik: string;
  arbetsplatsnamn: string;
  relevans: number;
  annonsid: string;
  sista_ansokningsdag: string;
}

interface JobMatches {
  matchningslista: {
    matchningdata: JobMatchData[];
  };
}

const matches = 20;
const stockholmLanId = 1;
const searchTerm = "javascript";

const main = async () => {
  const today = DateTime.utc();

  const { body } = await got(
    `https://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?lanid=${stockholmLanId}&nyckelord=${searchTerm}&sida=1&antalrader=${matches}`,

    {
      headers: {
        Accept: "application/json"
      }
    }
  ).catch(error => {
    console.error({
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return process.exit(100);
  });

  fs.writeFileSync("output.json", body);

  const jobMatches: JobMatches = JSON.parse(body);

  const shortInfos = jobMatches.matchningslista.matchningdata
    .filter(
      ({ sista_ansokningsdag }) =>
        DateTime.fromISO(sista_ansokningsdag) >= today
    )
    .map(
      ({
        annonsid,
        annonsrubrik,
        arbetsplatsnamn,
        relevans,
        sista_ansokningsdag
      }) => ({
        annonsid,
        annonsrubrik,
        arbetsplatsnamn,
        relevans,
        sista_ansokningsdag,
        daysLeft: DateTime.fromISO(sista_ansokningsdag)
          .diff(today, ["days", "hours"])
          .toObject().days
      })
    );

  console.log(shortInfos);

  fs.writeFileSync("short_infos.json", JSON.stringify(shortInfos, null, 2));
};

main();
