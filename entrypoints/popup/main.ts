import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

const app = createApp(App)

// 捕获渲染 / 生命周期 / setup 中未捕获的错误
app.config.errorHandler = (err, instance, info) => {
  console.error("Vue error:", err, info)
  document.body.textContent = err + ''
}

// 捕获异步错误（比如 Promise）
app.config.warnHandler = (msg, instance, trace) => {
  console.warn("Vue warning:", msg, trace)
}

app.mount('#app')

// function dumpError(err: string) {
//     const app = document.querySelector('#error')
//     if (app) {
//         app.textContent = err
//     }
// }

// window.onerror = function (message, source, lineno, colno, error) {
//     dumpError(message.toString())
// }
// window.addEventListener('unhandledrejection', (event) => {
//     dumpError(event.reason)
// });