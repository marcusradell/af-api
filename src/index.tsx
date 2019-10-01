import express from "express";
import dotenv from "dotenv";
import { jobs } from "./jobs";
import React from "react";
import { renderToString } from "react-dom/server";
import { htmlTemplate } from "./html_template";

const main = async () => {
  dotenv.config();
  const app = express();

  if (!process.env.PORT) {
    throw new Error("Missing process.env.PORT.");
  }

  if (!process.env.JOB_MATCHES) {
    throw new Error("Missing process.env.JOB_MATCHES.");
  }

  const matches = parseInt(process.env.JOB_MATCHES, 10);

  if (isNaN(matches)) {
    throw new Error("Failed casting process.env.JOB_MATCHES to an integer.");
  }

  const shortInfos = await jobs(matches);

  app.get("/", (req, res) => {
    const reactDom = renderToString(
      <div>
        {shortInfos.map(si => (
          <div key={si.annonsid} style={{ marginBottom: "100px" }}>
            <div>
              <h1
                style={{
                  background: "purple",
                  color: "white",
                  textAlign: "center",
                  margin: 0,
                  padding: "5px"
                }}
              >
                {si.arbetsplatsnamn}
              </h1>
            </div>
            <h2
              style={{
                background: "black",
                color: "white",
                textAlign: "center",
                margin: 0,
                padding: "5px"
              }}
            >
              {si.annonsrubrik}
            </h2>
            <div className="container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <h3>Score: {si.relevans}</h3>
                <h3>Days left: {si.daysLeft}</h3>

                <img
                  src={si.logotype}
                  alt="logotype"
                  style={{
                    height: "auto",
                    width: "100px",
                    margin: "15px"
                  }}
                />
              </div>

              <p>{si.jobDescription}</p>
            </div>
          </div>
        ))}
      </div>
    );

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlTemplate(reactDom));
  });

  app.get("/api", (req, res) => {
    res.json(shortInfos);
  });

  app.listen(process.env.PORT, () => {
    console.log("Server started.");
  });
};

main();
