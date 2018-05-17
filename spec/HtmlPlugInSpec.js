describe("Html plug in", () => {

    function exeuteTest(html) {        
        var htmlPlugin = require("../plugins/html")("t");
        var tokens = {};
        htmlPlugin.parse({contents: html },(key, value) => tokens[key] = value);
        return tokens;
    }

    it("should extract inner text", () => {
        var html = "<html><body><span t='test.X1'>Test content</span></body></html>";
        
        const tokens = exeuteTest(html);

        expect(tokens["test.X1"]).toBe("Test content");
    });
    
    it("should extract multiple i18n attributes from one html element", () => {
        var html = "<html><body><a t='test.X1;[href]test.X2' href='https://test.local'>Open test page</a></body></html>";

        const tokens = exeuteTest(html);

        expect(tokens["test.X1"]).toBe("Open test page");
        expect(tokens["test.X2"]).toBe("https://test.local");
    });

    it("should extract nested html elements", () => {
        var html = "<html><body><a t='[href]faq.t4' href='https://openkeys.de'><span t='faq.t28'>openkeys.de</span></a></body></html>";
        
        const tokens = exeuteTest(html);

        expect(tokens["faq.t4"]).toBe("https://openkeys.de");
        expect(tokens["faq.t28"]).toBe("openkeys.de");
    });
});