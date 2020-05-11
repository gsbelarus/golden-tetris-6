import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './game/App';
import * as serviceWorker from './serviceWorker';
import { NoChatWarning } from './game/NoChatWarning';
import { Lang } from './game/stringResources';

const params = new URLSearchParams(window.location.search);
const lang = (params.get('lang') ?? 'en') as Lang;
const root = document.getElementById('root');

if (params.has('no_chat_warning')) {
  ReactDOM.render(<NoChatWarning lang={lang}/>, root);
} else {
  ReactDOM.render(<App lang={lang} />, root);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
