import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("AppErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191919] flex flex-col items-center justify-center gap-6 p-8">
          <img
            src="/logo.png"
            alt="Mobile Tyre Van City"
            className="h-16 object-contain opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="text-center max-w-md">
            <h1 className="text-white text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              The page failed to load. Please try refreshing — if the problem persists, contact us on{" "}
              <a href="tel:01512038500" className="text-[#8bc440] hover:underline">0151 203 8500</a>.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#8bc440] text-[#191919] font-semibold rounded-md hover:bg-[#7ab030] transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
