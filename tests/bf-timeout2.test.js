describe("Timeout tests", () => {
  beforeAll(async () => {
    await page.goto(PATH, { waitUntil: "load" });
    page.on("console", msg => {
      console.log(
        msg.text() + "\n" + msg.location().url + ":" + msg.location().lineNumber
      );
    });
  });

  it("Custom timeout test", async () => {
    jest.setTimeout(10000);
    var result = await page.evaluate(async () => {
      var success = true;
      var data = undefined;
      try {
        data = await betterFetcher.get("https://httpstat.us/200", {
          timeout: 10000
        });
      } catch (e) {
        console.log(e);
        success = false;
      }
      if (!data) {
        success = false;
      }
      return Promise.resolve(success);
    });

    expect(result).toBeTruthy();
  });
});
