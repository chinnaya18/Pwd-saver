const fs = require("node:fs");
const crypto = require("node:crypto");
const readline = require("readline");

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.createHash("sha256").update("my-secret-key").digest();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class IsFileExists {
  constructor(filename) {
    this.filename = filename;
  }

  checkFile() {
    if (!fs.existsSync("userPasswords")) fs.mkdirSync("userPasswords");
    const files = fs.readdirSync("userPasswords");
    for (const file of files) {
      if (file === this.filename + ".txt") return false;
    }
    return true;
  }
}

class Hash {
  encrypt(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");

    return { encryptedPassword: encrypted, iv: iv.toString("hex") };
  }

  decrypt(encryptedPassword, ivHex) {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(ivHex, "hex")
    );

    let decrypted = decipher.update(encryptedPassword, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

class PasswordSaver extends Hash {
  constructor(username, password, filename, needPasswordGeneration = false) {
    super();
    this.username = username;
    this.password = password || null;
    this.needPasswordGeneration = needPasswordGeneration;
    this.file = userPasswords/${filename}.txt;
  }

  pwdGen() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
    let password = "";
    for (let i = 0; i < 10; i++) {
      const ranInd = Math.floor(Math.random() * chars.length);
      password += chars[ranInd];
    }
    return password;
  }

  addAnother(username, password) {
    this.username = username;
    this.password = password ? password : this.pwdGen();
    this.save();
  }

  save() {
    const { encryptedPassword, iv } = this.encrypt(this.password);
    const line = ${this.username}|${encryptedPassword}|${iv}\n;

    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, line);
    } else {
      fs.appendFileSync(this.file, line);
    }
    console.log("Password saved successfully.");
  }

  retrievePassword(username) {
    if (!fs.existsSync(this.file)) {
      console.log("No password file found.");
      return;
    }

    const lines = fs.readFileSync(this.file, "utf8").trim().split("\n");

    for (const line of lines) {
      const [storedUser, encryptedPassword, iv] = line.split("|");

      if (storedUser === username) {
        const password = this.decrypt(encryptedPassword, iv);
        console.log(Password for ${username}: ${password});
        return;
      }
    }

    console.log("Username not found.");
  }
}

// ---- READLINE FLOW ----

rl.question("Do you have a file? (Yes/No): ", (answer) => {
  if (answer.toLowerCase() === "no") {
    askFileName();
  } else {
    rl.question("Enter existing file name: ", (filename) => {
      askCredentials(filename);
    });
  }
});

function askFileName() {
  rl.question("Enter a new file name: ", (filename) => {
    const checkFile = new IsFileExists(filename);
    if (!checkFile.checkFile()) {
      console.log("File already exists. Please enter a unique file name.");
      askFileName();
    } else {
      console.log("File name is unique.");
      askCredentials(filename);
    }
  });
}

function askCredentials(filename) {
  rl.question("Enter username: ", (username) => {
    rl.question("Enter password (leave empty to auto-generate): ", (password) => {
      const saver = new PasswordSaver(
        username,
        password,
        filename,
        password === ""
      );

      if (password === "") {
        saver.password = saver.pwdGen();
        console.log(Generated password: ${saver.password});
      }

      saver.save();
      askRetrieve(filename);
    });
  });
}

function askRetrieve(filename) {
  rl.question("Do you want to retrieve a password? (Yes/No): ", (answer) => {
    if (answer.toLowerCase() === "yes") {
      rl.question("Enter username to retrieve: ", (username) => {
        const saver = new PasswordSaver(null, null, filename);
        saver.retrievePassword(username);
        rl.close();
      });
    } else {
      rl.close();
    }
  });
}