const fs = require("fs");
const crypto = require("crypto");
const { RestPkiClient, StandardSecurityContexts } = require("restpki-client");

let appRoot = process.cwd();

class Util {
  static getRestPkiClient() {
    // -----------------------------------------------------------------------
    // PLACE YOUR API ACCESS TOKEN BELOW
    let accessToken =
      "i8PMf5wvtkKg8YKYK697YTHKor3yqHkwqgbxVwTAkmcaKwaV5JSkxnL5Snpt2ltJRDj1igN2MNUWxG6Cjpj-agXAEQEIlxMioB2yNZLTuvetq_eDsZ4d5af9UX_haivtFkPZAgoua8zEVcmmF4hqdRoPT2dnpG73nvEK_ZfsNErKkI8K5fSEoBDZC5qSbLvYfaiy_xtC9u_KeOy8c1X8-VQJ7gYhjS5SYKsOI5B_e3GWasTYP0I384pDy1wUWJczzm6Rs5jqZaDBYCBlSzInJc4XMZ0NaUZjAXX_hstSJTqSLtAzddMxwNlYQkQwbEW7vADwL9Os1xjM1paP0kjvdTeEJNSVMPnb62FVp7T84_uUxPxHX4WTwpCbaKLMdiSsTRreGyOEeEm4jdTQDQV6er9xgezXg_9m59pV0hdMRdfpHvCukr0uF-R59L97R13zB9ElFx1jWx9jveibytqtUc4BHhmh7K7Bpz28MXEySaIpbhtM";
    //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // -----------------------------------------------------------------------

    // Throw exception if token is not set (this check is here just for the
    // sake of newcomers, you can remove it).
    if (!accessToken || accessToken.indexOf(" API ") >= 0) {
      throw new Error(
        "The API access token was not set! Hint: to run this sample you must generate an API access token on the REST PKI website and paste it on the file util.js"
      );
    }

    // -----------------------------------------------------------------------
    // IMPORTANT NOTICE: in production code, you should use HTTPS to
    // communicate with REST PKI, otherwise your API access token, as well as
    // the documents you sign, will be sent to REST PKI unencrypted.
    // -----------------------------------------------------------------------
    let restPkiUrl = "https://pki.rest/";

    return new RestPkiClient(restPkiUrl, accessToken);
  }

  /**
   * This method is called by all pages to determine the security context to be
   * used.
   *
   * Security contexts dictate witch root certification authorities are trusted
   * during certificate validation. In you API calls, you can use on of the
   * standard security contexts or reference one of your custom contexts.
   */
  static getSecurityContextId(env) {
    if (env === "development") {
      /*
       * Lacuna Text PKI (for development purposes only!)
       *
       * This security context trusts ICP-Brasil certificates as well as
       * certificates on Lacuna Software's test PKI. Use it to accept the
       * test certificates provided by Lacuna Software.
       *
       * THIS SHOULD NEVER BE USED ON A PRODUCTION ENVIRONMENT!
       */
      return StandardSecurityContexts.LACUNA_TEST;
      // Notice for On Premises users: this security context might not exist
      // on your installation, if you encounter an error please contact
      // developer support.
    }

    // In production, accepting only certificates from ICP-Brasil
    return StandardSecurityContexts.PKI_BRAZIL;
  }

  static createAppData() {
    let appDataPath = appRoot + "/public/app-data/";
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath);
    }
  }

  static setExpiredPage(res) {
    res.set({
      "Cache-Control":
        "private, no-store, max-age=0, no-cache, must-revalidate, post-check=0, pre-check=0",
      Pragma: "no-cache",
    });
  }

  static getPdfStampContent() {
    return fs.readFileSync(appRoot + "/public/PdfStamp.png");
  }

  static getSamplePdfPath() {
    return appRoot + "/public/SampleDocument.pdf";
  }

  static getSampleXmlPath() {
    return appRoot + "/public/SampleDocument.xml";
  }

  static getSampleNFePath() {
    return appRoot + "/public/SampleNFe.xml";
  }

  static getValidationResultIcon(isValid) {
    let filename = isValid ? "ok.png" : "not-ok.png";
    return fs.readFileSync(appRoot + "/public/" + filename);
  }

  static getIcpBrasilLogoContent() {
    return fs.readFileSync(appRoot + "/public/icp-brasil.png");
  }

  static joinStringPt(strings) {
    let text = "";
    let count = strings.length;
    for (let i = 0; i < strings.length; i++) {
      if (i > 0) {
        if (i < count - 1) {
          text += ", ";
        } else {
          text += " e ";
        }
      }
      text += strings[i];
    }
    return text;
  }

  static generateVerificationCode() {
    /*
     * Configuration of the code generation
     * ------------------------------------
     *
     * - CodeSize   : size of the code in characters
     *
     * Entropy
     * -------
     *
     * The resulting entropy of the code in bits is the size of the code
     * times 4. Here are some suggestions:
     *
     * - 12 characters = 48 bits
     * - 16 characters = 64 bits
     * - 20 characters = 80 bits
     * - 24 characters = 92 bits
     */
    let codeSize = 16;

    // Generate the entropy with Node.js Crypto's cryptographically strong
    // pseudo-random generation function.
    let numBytes = Math.floor(codeSize / 2);
    let randBuffer = crypto.randomBytes(numBytes);

    return randBuffer.toString("hex").toUpperCase();
  }

  static formatVerificationCode(code) {
    /*
     * Examples
     * --------
     *
     * - codeSize = 12, codeGroups = 3 : XXXX-XXXX-XXXX
     * - codeSize = 12, codeGroups = 4 : XXX-XXX-XXX-XXX
     * - codeSize = 16, codeGroups = 4 : XXXX-XXXX-XXXX-XXXX
     * - codeSize = 20, codeGroups = 4 : XXXXX-XXXXX-XXXXX-XXXXX
     * - codeSize = 20, codeGroups = 5 : XXXX-XXXX-XXXX-XXXX-XXXX
     * - codeSize = 25, codeGroups = 5 : XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
     */
    let codeGroups = 4;

    // Return the code separated in groups
    let charsPerGroup = (code.length - (code.length % codeGroups)) / codeGroups;
    let text = "";
    for (let i = 0; i < code.length; i++) {
      if (i !== 0 && i % charsPerGroup === 0) {
        text += "-";
      }
      text += code[i];
    }

    return text;
  }

  static parseVerificationCode(code) {
    let text = "";
    for (let i = 0; i < code.length; i++) {
      if (code[i] !== "-") {
        text += code[i];
      }
    }

    return text;
  }
}

exports.Util = Util;
