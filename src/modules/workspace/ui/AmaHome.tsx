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
    <main className="ama-home" aria-labelledby="ama-home-title">
      <section className="ama-home-content">
        <div className="ama-wordmark">
          <img
            className="ama-company-logo"
            src="/brand/atelier-moderne-logo.png"
            alt="L’Atelier Moderne de l’Aluminium"
          />
        </div>
        <p className="eyebrow">Internal operations</p>
        <h1 id="ama-home-title">AMA Team Workspace</h1>
        <p className="ama-home-intro">Choose a workspace for your team.</p>
        <div className="ama-service-list">
          <button
            className="ama-service-card"
            type="button"
            onClick={onSelectEstimation}
          >
            <span className="ama-service-icon">
              <Icon name="box" size={34} />
            </span>
            <span>
              <b>Estimation Service</b>
              <small>Prepare estimates and quotations for clients</small>
            </span>
            <Icon name="arrow" size={20} />
          </button>
          <button
            className="ama-service-card"
            type="button"
            onClick={onSelectStock}
          >
            <span className="ama-service-icon ama-stock-order-icon">
              <Icon name="warehouse" size={26} />
              <Icon name="order" size={20} />
            </span>
            <span>
              <b>AMA Stock</b>
              <small>Manage internal stock</small>
            </span>
            <Icon name="arrow" size={20} />
          </button>
          <button
            className="ama-service-card"
            type="button"
            onClick={onSelectExecution}
          >
            <span className="ama-service-icon">
              <Icon name="folder" size={30} />
            </span>
            <span>
              <b>Projects Under Execution</b>
              <small>Create, manage, and track company projects</small>
            </span>
            <Icon name="arrow" size={20} />
          </button>
        </div>
      </section>
    </main>
  );
}
