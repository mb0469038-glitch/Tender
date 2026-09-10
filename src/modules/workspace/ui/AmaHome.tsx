import { Icon } from "../../../design-system/Icon";

type AmaHomeProps = {
  onSelectEstimation: () => void;
  onSelectStock: () => void;
  onSelectExecution: () => void;
};

export function AmaHome({
  onSelectEstimation,
  onSelectStock,
  onSelectExecution,
}: AmaHomeProps) {
  return (
    <main
      className="min-h-screen grid place-items-center p-9 [background:radial-gradient(circle_at_50%_2%,#e9f8fd_0,#f7fbfd_43%,#e8f2f5_100%)]"
      aria-labelledby="ama-home-title"
    >
      <section className="grid justify-items-center w-full max-w-[540px] text-center">
        <div className="grid place-items-center min-h-[132px] mb-3.5">
          <img
            className="block w-[155px] max-w-[80vw] h-auto"
            src="/brand/atelier-moderne-logo.png"
            alt="L’Atelier Moderne de l’Aluminium"
          />
        </div>
        <p className="m-0 mb-2 text-[#078fbe] text-[11px] font-extrabold tracking-[0.09em] uppercase">
          Internal operations
        </p>
        <h1
          id="ama-home-title"
          className="m-0 text-[#29383c] text-[32px] font-bold tracking-[-0.035em]"
        >
          AMA Team Workspace
        </h1>
        <p className="mt-2 mb-7 text-[#55717a] text-[15px]">
          Choose a workspace for your team.
        </p>
        <div className="grid gap-3 w-full">
          <button
            className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-4 w-full p-5 border border-[#addae7] rounded-[14px] bg-white text-[#16464a] text-left shadow-[0_14px_35px_rgba(26,101,126,0.13)] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-[#08afe4] hover:shadow-[0_18px_40px_rgba(8,143,190,0.2)] cursor-pointer"
            type="button"
            onClick={onSelectEstimation}
          >
            <span className="grid place-items-center w-[62px] h-[62px] rounded-[12px] bg-[#e0f5fb] text-[#087fa8]">
              <Icon name="box" size={34} />
            </span>
            <span className="grid gap-1">
              <b className="text-[17px] font-bold leading-tight">Estimation Service</b>
              <small className="text-[#668084] text-[12px] font-semibold">
                Prepare estimates and quotations for clients
              </small>
            </span>
            <span className="text-[#049ed2]">
              <Icon name="arrow" size={20} />
            </span>
          </button>
          <button
            className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-4 w-full p-5 border border-[#addae7] rounded-[14px] bg-white text-[#16464a] text-left shadow-[0_14px_35px_rgba(26,101,126,0.13)] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-[#08afe4] hover:shadow-[0_18px_40px_rgba(8,143,190,0.2)] cursor-pointer"
            type="button"
            onClick={onSelectStock}
          >
            <span className="relative grid place-items-center w-[62px] h-[62px] rounded-[12px] bg-[#e0f5fb] text-[#087fa8] [&>svg:last-child]:absolute [&>svg:last-child]:right-[9px] [&>svg:last-child]:bottom-[8px] [&>svg:last-child]:p-[2px] [&>svg:last-child]:rounded-[4px] [&>svg:last-child]:bg-[#e0f5fb]">
              <Icon name="warehouse" size={26} />
              <Icon name="order" size={20} />
            </span>
            <span className="grid gap-1">
              <b className="text-[17px] font-bold leading-tight">AMA Stock</b>
              <small className="text-[#668084] text-[12px] font-semibold">
                Manage internal stock
              </small>
            </span>
            <span className="text-[#049ed2]">
              <Icon name="arrow" size={20} />
            </span>
          </button>
          <button
            className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-4 w-full p-5 border border-[#addae7] rounded-[14px] bg-white text-[#16464a] text-left shadow-[0_14px_35px_rgba(26,101,126,0.13)] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-[#08afe4] hover:shadow-[0_18px_40px_rgba(8,143,190,0.2)] cursor-pointer"
            type="button"
            onClick={onSelectExecution}
          >
            <span className="grid place-items-center w-[62px] h-[62px] rounded-[12px] bg-[#e0f5fb] text-[#087fa8]">
              <Icon name="folder" size={30} />
            </span>
            <span className="grid gap-1">
              <b className="text-[17px] font-bold leading-tight">Projects Under Execution</b>
              <small className="text-[#668084] text-[12px] font-semibold">
                Create, manage, and track company projects
              </small>
            </span>
            <span className="text-[#049ed2]">
              <Icon name="arrow" size={20} />
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
