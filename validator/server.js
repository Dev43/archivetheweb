import http from "http";
import createBrowserless from "browserless";
import getHTML from "html-get";
import queryString from "query-string";

const browserlessFactory = createBrowserless();
const hostname = "127.0.0.1";
const port = 3001;

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("got request ", req.url);
  const parsed = queryString.parse(req.url);
  let url = parsed["/?url"];

  let content = await getWebpageSource(url);

  res.end(content);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const getContent = async (url) => {
  // create a browser context inside Chromium process
  const browserContext = browserlessFactory.createContext();
  const getBrowserless = () => browserContext;
  const result = await getHTML(url, { getBrowserless });
  // close the browser context after it's used
  await getBrowserless((browser) => browser.destroyContext());
  return result;
};

async function getWebpageSource(url) {
  try {
    let content = await getContent(url);
    return content.html;
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
