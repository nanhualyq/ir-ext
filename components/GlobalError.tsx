import { PropsWithChildren } from "react";

export default function ({ children }: PropsWithChildren) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 捕获同步错误
    window.onerror = (message, source, lineno, colno, err) => {
      setError(err || new Error(message + ""));
      return false; // 保留默认控制台报错
    };

    // 捕获未处理 Promise 错误
    window.onunhandledrejection = (event) => {
      setError(event.reason);
    };
  }, []);

  if (error) {
    return <div style={{ color: "red" }}>{error + ""}</div>;
  }

  return children;
}
