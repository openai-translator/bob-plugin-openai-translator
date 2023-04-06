<h4 align="right">
  <a href="https://github.com/yetone/bob-plugin-openai-translator/blob/master/README.md">简体中文</a> | <strong>English</strong>
</h4>

<div>
  <h1 align="center">OpenAI Translator Bob Plugin</h1>
  <p align="center">
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases" target="_blank">
        <img src="https://github.com/yetone/bob-plugin-openai-translator/actions/workflows/release.yaml/badge.svg" alt="release">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/Stars/yetone/bob-plugin-openai-translator?style=flat">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/OpenAI-Bob-brightgreen?style=flat">
    </a>
    <a href="https://github.com/yetone/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/badge/Langurage-JavaScript-brightgreen?style=flat&color=blue">
    </a>
  </p>
</div>

> **Note**
>
> Important update: Non-macOS users can use my browser extension based on ChatGPT API for word translation [openai-translator](https://github.com/yetone/openai-translator) to solve urgent needs.


## Demonstration

![demo](https://user-images.githubusercontent.com/1206493/221086195-f1ed941d-4dfa-4aa0-9d47-56c258a8f854.gif)

"""
## Introduction

ChatGPT showcases the greatness of GPT models, so I have implemented the Bob translation + polishing + grammar modification plugin using OpenAI's API, with outstanding results!

### Polishing Feature

This plugin supports polishing sentences and modifying grammar using the ChatGPT API. To do so, just set the target language to be the same as the source language. It's a comprehensive alternative to Grammarly! And in theory, any language can be polished, not just English.

If you don't like combining translation functionality and text polishing, a separate plugin specifically for text polishing and grammar correction is available: [bob-plugin-openai-polisher](https://github.com/yetone/bob-plugin-openai-polisher). This polishing plugin has more advanced polishing features, such as explaining the modification reasons, etc.

### Language Model

To use the ChatGPT API, go to Bob's settings page and change the plugin model to `gpt-3.5-turbo-0301` or `gpt-3.5-turbo`:

![how to use ChatGPT API](https://user-images.githubusercontent.com/1206493/222339607-d8f05042-4b65-495c-af58-849891de7434.png)

## Usage

1. Install [Bob](https://bobtranslate.com/guide/#%E5%AE%89%E8%A3%85) (version >= 0.50), a macOS translation and OCR software

2. Download this plugin: [openai-translator.bobplugin](https://github.com/yetone/bob-plugin-openai-translator/releases/latest)

3. Install this plugin:
  ![Installation Steps](https://user-images.githubusercontent.com/1206493/219937302-6be8d362-1520-4906-b8d6-284d01012837.gif)

4. Get your API KEY from [OpenAI](https://platform.openai.com/account/api-keys)

5. Enter the API KEY in Bob Preferences > Services > This plugin configuration interface's API KEY input box:
  ![Settings Steps](https://user-images.githubusercontent.com/1206493/219937398-8e5bb8d2-7dc8-404a-96e7-a937e08c939f.gif)

6. Install [PopClip](https://bobtranslate.com/guide/integration/popclip.html) for highlighted text mouse proximity floating icon:
  ![PopClip](https://user-images.githubusercontent.com/1206493/219933584-d0c2b6cf-8fa0-40a6-858f-8f4bf05f38ef.gif)

## Thanks

I'm just a small Bob plugin, and the powerful part is Bob itself. I pay tribute to its developer [ripperhe](https://github.com/ripperhe)!

### Buy me a coffee

<div align="center">
  <img height="360" src="https://user-images.githubusercontent.com/1206493/220753437-90e4039c-d95f-4b6a-9a08-b3d6de13211f.png" />
  <img height="360" src="https://user-images.githubusercontent.com/1206493/220756036-d9ac4512-0375-4a32-8c2e-8697021058a2.png" />
</div>
