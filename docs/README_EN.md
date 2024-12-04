<h4 align="right">
  <a href="https://github.com/openai-translator/bob-plugin-openai-translator/blob/main/README.md">简体中文</a> | <strong>English</strong>
</h4>

<div>
  <h1 align="center">OpenAI Translator Bob Plugin</h1>
  <p align="center">
    <a href="https://github.com/openai-translator/bob-plugin-openai-translator/releases" target="_blank">
        <img src="https://github.com/openai-translator/bob-plugin-openai-translator/actions/workflows/release.yaml/badge.svg" alt="release">
    </a>
    <a href="https://github.com/openai-translator/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/Stars/openai-translator/bob-plugin-openai-translator?style=flat">
    </a>
    <a href="https://github.com/openai-translator/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/OpenAI-Bob-brightgreen?style=flat">
    </a>
    <a href="https://github.com/openai-translator/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/Langurage-JavaScript-brightgreen?style=flat&color=blue">
    </a>
  </p>
</div>

> **Note**
>
> Important update: Non-macOS users can use my browser extension based on OpenAI API for word translation [openai-translator](https://github.com/yetone/openai-translator) to solve urgent needs.

## Introduction

ChatGPT showcases the greatness of GPT models, so I have implemented the Bob translation + polishing + grammar modification plugin using OpenAI's API, with outstanding results!

<details>

<summary>Demonstration 👀</summary>

![demo](https://user-images.githubusercontent.com/1206493/219937398-8e5bb8d2-7dc8-404a-96e7-a937e08c939f.gif)

</details>

### Polishing Feature

This plugin supports polishing sentences and modifying grammar using the OpenAI API. To do so, just set the target language to be the same as the source language. It's a comprehensive alternative to Grammarly! And in theory, any language can be polished, not just English.

If you don't like combining translation functionality and text polishing, a separate plugin specifically for text polishing and grammar correction is available: [bob-plugin-openai-polisher](https://github.com/yetone/bob-plugin-openai-polisher). This polishing plugin has more advanced polishing features, such as explaining the modification reasons, etc.

## Usage

1. Install [Bob](https://bobtranslate.com/guide/#%E5%AE%89%E8%A3%85) (version >= 0.50), a macOS translation and OCR software

2. Download this plugin: [openai-translator.bobplugin](https://github.com/openai-translator/bob-plugin-openai-translator/releases/latest)

3. <details>

   <summary>Install this plugin 👀</summary>

   ![Installation Steps](https://user-images.githubusercontent.com/1206493/219937302-6be8d362-1520-4906-b8d6-284d01012837.gif)

   </details>

4. Get your API KEY from [OpenAI](https://platform.openai.com/account/api-keys)

5. Enter the API KEY in Bob Preferences > Services > This plugin configuration interface's API KEY input box:
    - If you would like to learn more about other settings, please refer to the [Configuration Manual](./docs/configuration_manual_EN.md)

      <details>

      <summary>Settings Steps 👀</summary>

      ![Settings Steps](https://user-images.githubusercontent.com/1206493/219937398-8e5bb8d2-7dc8-404a-96e7-a937e08c939f.gif)

      </details>

6. <details>

   <summary>Install PopClip for highlighted text mouse proximity floating icon 👀</summary>

   [![PopClip](https://user-images.githubusercontent.com/1206493/219933584-d0c2b6cf-8fa0-40a6-858f-8f4bf05f38ef.gif)](https://bobtranslate.com/guide/integration/popclip.html)

   </details>


## Contributing

If you want to contribute to Renovate or get a local copy running, please read the instructions in [contributing guidelines](../.github/contributing.md). To get started look at the list of [good first issues](https://github.com/openai-translator/bob-plugin-openai-translator/contribute).

## Thanks

I'm just a small Bob plugin, and the powerful part is Bob itself. I pay tribute to its developer [ripperhe](https://github.com/ripperhe)!
