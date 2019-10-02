import got from "got";

const modelFactory = () => {
  const getJobDescription = (jobId: string) => {
    return got
      .post(
        `https://www.arbetsformedlingen.se/rest/pbapi/af/v1/matchning/matchandeRekryteringsbehov/${jobId}`,
        {
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          }
        }
      )
      .then(result => {
        const jobDetails = JSON.parse(result.body).annonstext;
        return {
          status: "succeeded",
          jobDetails
        } as const;
      })
      .catch(
        error =>
          ({
            status: "exceptioned",
            error: {
              message: error.message
            }
          } as const)
      );
  };

  return { getJobDescription };
};

export const jobDescriptionFactory = () => {
  const model = modelFactory();

  return { model };
};
