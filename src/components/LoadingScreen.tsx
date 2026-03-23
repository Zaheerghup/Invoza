"use client";

interface LoadingScreenProps {
  inline?: boolean;
  message?: string;
}

export default function LoadingScreen({ inline = false, message = "LOADING DATA" }: LoadingScreenProps) {
  
  // If rendering inside a container (like the dashboard cards)
  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center w-full animate-[fadeIn_0.2s_ease-out]">
        <div className="w-10 h-10 mb-5 relative flex items-center justify-center">
           <div className="spinner w-full h-full absolute" />
           <div className="w-3 h-3 bg-[var(--primary)] rounded-full animate-pulse"></div>
        </div>
        <div className="text-[10px] font-black text-[var(--text-muted)] tracking-widest flex items-center justify-center gap-2 uppercase">
          {message}
          <span className="flex gap-1">
            <span className="w-1 h-1 bg-[var(--text-light)] rounded-full animate-[bounce_1s_infinite_0ms]"></span>
            <span className="w-1 h-1 bg-[var(--text-light)] rounded-full animate-[bounce_1s_infinite_150ms]"></span>
            <span className="w-1 h-1 bg-[var(--text-light)] rounded-full animate-[bounce_1s_infinite_300ms]"></span>
          </span>
        </div>
        <style jsx>{`
          .spinner {
            border: 3px solid rgba(0, 0, 0, 0.04);
            border-top: 3px solid var(--primary);
            border-right: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 0.7s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Full Page Loading Fallback
  return (
    <div className="fixed inset-0 bg-[var(--bg-app)] flex flex-col items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,var(--primary-light)_0%,transparent_70%)] opacity-10 blur-[50px] -z-10" />

      <div className="w-16 h-16 flex items-center justify-center mb-8 relative">
        <div className="spinner w-full h-full absolute" />
        <div className="w-4 h-4 bg-[var(--primary)] rounded-full animate-pulse shadow-[0_0_15px_var(--primary-light)]"></div>
      </div>
      
      <div className="text-center">
        <h2 className="m-0 text-[20px] font-black text-[var(--text-main)] tracking-[8px] uppercase">
          Invoza
        </h2>
        <div className="mt-5 text-[10px] font-black text-[var(--text-muted)] tracking-[3px] flex items-center justify-center gap-3 uppercase">
          {message}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.03);
          border-top: 4px solid var(--primary);
          border-right: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 0.7s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
