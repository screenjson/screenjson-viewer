import { mount } from 'svelte';
import App from './App.svelte';
// app.css pulls in both our styles and the library's (single Tailwind pass).
import './app.css';

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
