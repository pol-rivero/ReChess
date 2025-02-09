# ReChess: Chess Reinvented by You

ReChess is an intuitive and easy-to-use chess web app that allows you to create and play your own highly personalized chess variants. It's built with [Vue.js](https://vuejs.org/) and [TypeScript](https://www.typescriptlang.org/), and uses a heavily modified version of the [Protochess engine](https://github.com/pol-rivero/protochess-engine) for the game logic.

Check it out at [rechess.org](https://rechess.org)!

---

## Collaborating ❤

### Cloning the Repository

This project uses the `protochess-engine` repo as a submodule. If you haven't cloned this repository with the `--recurse-submodules` option, you can run the following command to clone the submodules:

```sh
git submodule update --init --recursive
```

When pulling changes, I recommend using the `--recurse-submodules` option to make sure you also get the latest changes in the submodules, if any:

```sh
git pull --recurse-submodules
```

Make sure you also have `cargo`, `wasm-pack` and `rustup` installed. The first compilation of the engine might take a while.


### Project Setup

```sh
npm install -g firebase-tools
npm install -g wasm-pack
npm install
```

Also make sure you have `rustup` installed, or follow the instructions [here](https://rustwasm.github.io/wasm-pack/book/prerequisites/non-rustup-setups.html) to use `wasm-pack` without `rustup`.

If you use VSCode, install the [Vue Language extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

### Using a Firebase backend

1. Create a Firebase project. Make sure to enable App Check (with reCAPTCHA), Firestore, Hosting, Storage and Functions.
   > Most of the development is done using a local emulator, but you may want to test the deployed production build
   > on a real backend without messing up your production data. In that case, I recommend creating a second Firebase project for development.

2. Go to [Google Cloud credentials](https://console.cloud.google.com/apis/credentials) and get your api keys:
   - **Browser Key for production**: The one that was created when you made your Firebase project. Restrict it to your domain.
   - **Private Key for development**: If you made a second project for development, use its key. Otherwise, create a new key and restrict it to `localhost`.
   
   From the project root, run `echo VITE_RECHESS_FIREBASE_API_KEY=[your private dev key] >> .config/.env.local`. Keep it secret!
   
   Configure GitHub Actions (or the system you use) to do the same with the production key when deploying to production.
   
   > Note: Remember that the browser key will be exposed to the client, so anyone can see and use it.
   > Make sure to restrict it to your domain and set up App Check properly.
   
   <details>
   <summary>APIs that need to be enabled</summary>
      <ul>
      <li> Cloud Firestore API </li>
      <li> Cloud Logging API </li>
      <li> Cloud Storage for Firebase API </li>
      <li> Firebase App Check API </li>
      <li> Firebase Hosting API </li>
      <li> Firebase Installations API </li>
      <li> Firebase Remote Config API </li>
      <li> Identity Toolkit API </li>
      <li> Token Service API </li>
      </ul>
   </details>

3. Update `src/firebase/credentials.ts` with your Firebase credentials. The `CAPTCHA_V3_PUBLIC_KEY` is the one you created for App Check.
   
4. Launch the app with `npm run dev` and open the browser console. You should see a message like this:
   ```
   App Check debug token: <TOKEN>. You will need to add it to your app's App Check settings in the Firebase console for it to work.
   ```
   Copy the token and add it to your Firebase project's App Check settings (see [docs](https://firebase.google.com/docs/app-check/web/debug-provider)).


### Compile and Hot-Reload for Development

```sh
npm run dev
```

This will also start the Firebase emulator suite. Once you see the message `All emulators ready! It is now safe to connect your app.`, you can open it at `http://localhost:5173`.

### Run unit tests

```sh
# Run in 2 different terminals:
firebase emulators:start --only firestore,storage,auth
npm test

# Or, if you only need to run the tests once:
firebase emulators:exec --only firestore,storage,auth 'npm test'
```

If you use VSCode, I recommend installing the [Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) and adding the following to your `settings.json`:

```json
"jest.jestCommandLine": "npx jest --config .config/jest.config.js",
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

Then you can preview the production build with `npm run preview`.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

If you use VSCode, I recommend installing the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and adding the following to your `settings.json`:

```json
"editor.codeActionsOnSave": {
   "source.fixAll": true
},
"eslint.options": {
   "overrideConfigFile": ".config/.eslintrc.cjs"
},
```

### Build and Deploy to Firebase

> Note: Do not deploy directly, since that will expose your private development API key. Instead, push to `main` and GitHub Actions will take care of it.

```sh
firebase login
npm run build
firebase deploy
```

### Assign moderators

```sh
npm run make-moderator -- <username>
```

Where `<username>` is the same text as the user's URL (`https://rechess.org/user/___`).
If the user is already a moderator, this will remove their moderator privileges.

This command requires the `admin-key.json` file to be present in [`.config`](.config).

---

## About the license 📜

All files in this repository (submodules not included) are licensed under the [MIT License](LICENSE). The `protochess-engine` and `chessgroundx` submodules are licensed under the [GNU General Public License v3](https://www.gnu.org/licenses/gpl-3.0.en.html), since those are forks of [raytran/protochess](https://github.com/raytran/protochess) and [gbtami/chessgroundx](https://github.com/gbtami/chessgroundx) (both licensed under the GPLv3).

This means that the project as a whole is licensed under the GPLv3, but some parts (namely, the code in this repository) are licensed under the MIT License, which is [GPL-compatible](https://www.gnu.org/licenses/license-list.en.html#Expat). See [this document](https://softwarefreedom.org/resources/2007/gpl-non-gpl-collaboration.html) for more information.

You are free to use the files in this repository under the terms of the MIT License, but if you also clone and use the `protochess-engine` submodule or the `chessgroundx` submodule, you must comply with the terms of the GPLv3.

