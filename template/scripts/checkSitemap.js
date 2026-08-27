const http = require("http");

function fetch(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "localhost", port: 3000, path }, (res) => {
        let body = "";
        res.on("data", (d) => (body += d.toString()));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body }),
        );
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

(async function () {
  try {
    const xsl = await fetch("/sitemap.xsl");
    console.log("---XSL STATUS---", xsl.status);
    console.log(xsl.headers);
    console.log("---XSL START---");
    console.log(xsl.body.slice(0, 1000));
    const bytes = Buffer.from(xsl.body).slice(0, 4);
    console.log(
      "---XSL BYTES---",
      bytes
        .toJSON()
        .data.map((b) => b.toString(16).padStart(2, "0"))
        .join(" "),
    );

    const xml = await fetch("/sitemap.xml");
    console.log("---XML STATUS---", xml.status);
    console.log(xml.headers);
    console.log("---XML START---");
    console.log(xml.body.slice(0, 2000));
  } catch (e) {
    console.error("FETCH ERROR", e);
    process.exit(1);
  }
})();
