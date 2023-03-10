<div>
  <h1 align="center">OpenAI Translator Bob Plugin</h1>
  <p align="center">
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases" target="_blank">
        <img src="https://github.com/yetone/bob-plugin-openai-translator/actions/workflows/release.yaml/badge.svg" alt="release">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/yetone/bob-plugin-openai-translator?style=flat">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/openai-Bob-brightgreen?style=flat">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/langurage-JavaScript-brightgreen?style=flat&color=blue">
    </a>
  </p>
</div>

Important update: Non-macOS users can use my browser extension based on ChatGPT API for word translation [openai-translator](https://github.com/yetone/openai-translator) to solve urgent needs.

# Screenshots

![](https://user-images.githubusercontent.com/1206493/221086195-f1ed941d-4dfa-4aa0-9d47-56c258a8f854.gif)

# Introduction

ChatGPT showed us the greatness of the GPT model, so I developed this Bob translation + polishing + grammar correction plugin using OpenAI's API, which has excellent results!

This plugin now supports using the ChatGPT API to refine and modify sentences for grammar. Simply select the target language to be the same as the source language, making it a comprehensive replacement for Grammarly! Moreover, theoretically any language can be refined, not just English.

If you don't like the translation and text polishing being put together, here is a separate plugin specifically for text polishing and grammar correction: [bob-plugin-openai-polisher](https://github.com/yetone/bob-plugin-openai-polisher). This polishing plugin has more advanced polishing functions, such as explaining modification reasons.

To use the ChatGPT API, you need to change the model of this plugin to `gpt-3.5-turbo-0301` or `gpt-3.5-turbo` on Bob's settings page:

![how to use ChatGPT API](https://user-images.githubusercontent.com/1206493/222339607-d8f05042-4b65-495c-af58-849891de7434.png)

This is just a small Bob plugin, the real power lies within Bob itself. Let's pay tribute to its developer [ripperhe](https://github.com/ripperhe)!

# Usage

1. Install [Bob](https://bobtranslate.com/guide/#%E5%AE%89%E8%A3%85) (version >= 0.50)
2. Download this plugin: [openai-translator.bobplugin](https://github.com/yetone/bob-plugin-openai-translator/releases)
3. Install this plugin:

![](https://user-images.githubusercontent.com/1206493/219937302-6be8d362-1520-4906-b8d6-284d01012837.gif)

4. Go to [OpenAI](https://platform.openai.com/account/api-keys) to get your API KEY
5. Fill in the API KEY in the configuration interface of Bob plugin

![](https://user-images.githubusercontent.com/1206493/219937398-8e5bb8d2-7dc8-404a-96e7-a937e08c939f.gif)

6. Install [PopClip](https://bobtranslate.com/guide/integration/popclip.html) to display a small icon near the mouse after selecting text

![](https://user-images.githubusercontent.com/1206493/219933584-d0c2b6cf-8fa0-40a6-858f-8f4bf05f38ef.gif)

# Buy me a coffee

<div align="center">
<img height="360" src="https://user-images.githubusercontent.com/1206493/220753437-90e4039c-d95f-4b6a-9a08-b3d6de13211f.png" />
<img height="360" src="https://user-images.githubusercontent.com/1206493/220756036-d9ac4512-0375-4a32-8c2e-8697021058a2.png" />
</div>
