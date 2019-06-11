describe("Timeout tests", () => {
  beforeAll(async () => {
    await page.goto(PATH, { waitUntil: "load" });
    page.on("console", msg => {
      console.log(
        msg.text() + "\n" + msg.location().url + ":" + msg.location().lineNumber
      );
    });
  });

  it("Default timeout test", async () => {
    jest.setTimeout(10000);
    var result = await page.evaluate(async () => {
      var success = false;
      var data = undefined;
      try {
        data = await betterFetcher.get("https://httpstat.us/200?sleep=5300");
      } catch (e) {
        success = true;
      }
      if (data) {
        success = false;
      }
      return Promise.resolve(success);
    });

    expect(result).toBeTruthy();
  });
});
