const http = require("http");

http
  .get({ host: "localhost", port: 3000, path: "/sitemap-pages.xml" }, (res) => {
    console.log("STATUS", res.statusCode);
    console.log(res.headers);
    let b = "";
    res.on("data", (d) => (b += d.toString()));
    res.on("end", () => {
      console.log("---PAGES START---");
      console.log(b.slice(0, 4000));
    });
  })
  .on("error", (e) => {
    console.error("ERR", e);
  });
