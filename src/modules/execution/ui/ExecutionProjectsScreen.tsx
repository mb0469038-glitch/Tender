import { Dispatch, FormEvent, SetStateAction } from "react";
import type { ExecutionProject, ExecutionProjectFile } from "../../../domain/types";
import { Icon } from "../../../design-system/Icon";
import { ProfileMenu } from "../../auth/ui/ProfileMenu";

type ExecutionProjectsScreenProps = {
  screen: "execution-projects" | "execution-project-detail";
  setScreen: (screen: any) => void;
  executionProjects: ExecutionProject[];
  selectedExecutionProjectId: string;
  executionFolderId: string | null;
  setExecutionFolderId: (id: string | null) => void;
  executionNewMenuOpen: boolean;
  setExecutionNewMenuOpen: Dispatch<SetStateAction<boolean>>;
  newExecutionItemType: "folder" | "optimization-material-order" | null;
  setNewExecutionItemType: (type: "folder" | "optimization-material-order" | null) => void;
  newExecutionItemName: string;
  setNewExecutionItemName: (name: string) => void;
  openModal: (type: "executionProject") => void;
  openExecutionProject: (id: string) => void;
  copyExecutionProject: (id: string) => void;
  removeExecutionProject: (id: string) => void;
  openExecutionWorkspace: (fileId: string) => void;
  createExecutionProjectItem: (event: FormEvent) => void;
  removeExecutionProjectItem: (id: string) => void;
};

export function ExecutionProjectsScreen({
  screen,
  setScreen,
  executionProjects,
  selectedExecutionProjectId,
  executionFolderId,
  setExecutionFolderId,
  executionNewMenuOpen,
  setExecutionNewMenuOpen,
  newExecutionItemType,
  setNewExecutionItemType,
  newExecutionItemName,
  setNewExecutionItemName,
  openModal,
  openExecutionProject,
  copyExecutionProject,
  removeExecutionProject,
  openExecutionWorkspace,
  createExecutionProjectItem,
  removeExecutionProjectItem,
}: ExecutionProjectsScreenProps) {
  const project = executionProjects.find((item) => item.id === selectedExecutionProjectId);

  const ExecutionProjects = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operational workspace</p>
          <h1>Projects Under Execution</h1>
          <p className="intro">This workspace is separate from tender estimates, assemblies, and drawings.</p>
        </div>
        <button className="primary-button" onClick={() => openModal("executionProject")}>
          <Icon name="plus" /> New project
        </button>
      </section>
      <section className="project-list">
        {executionProjects.length ? (
          executionProjects.map((proj) => (
            <article className="project-card" key={proj.id}>
              <div>
                <p className="eyebrow">
                  {[proj.client, proj.company, proj.location].filter(Boolean).join(" · ") || "No project details"}
                </p>
                <h2>{proj.name}</h2>
                <p>Created {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(proj.createdAt))}</p>
              </div>
              <div className="project-actions">
                <button className="primary-button" onClick={() => openExecutionProject(proj.id)}>
                  Open project <Icon name="arrow" size={16} />
                </button>
                <button className="secondary-button" onClick={() => copyExecutionProject(proj.id)}>
                  <Icon name="copy" size={16} /> Copy project
                </button>
                <button
                  className="icon-button danger-icon"
                  onClick={() => removeExecutionProject(proj.id)}
                  aria-label={`Delete ${proj.name}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="price-book-empty">No projects under execution yet. Create one to start tracking it here.</p>
        )}
      </section>
    </>
  );

  const ExecutionProjectFiles = () => {
    if (!project) return <ExecutionProjects />;
    const files = project.files ?? [];
    const currentItems = files.filter((item) => item.type !== "excel" && item.parentId === executionFolderId);
    const itemTypeLabel = (type: ExecutionProjectFile["type"]) =>
      type === "folder"
        ? "Folder"
        : type === "optimization-material-order"
          ? "Optimization & material order"
          : type === "optimization"
            ? "Optimization"
            : type === "material-order"
              ? "Material order"
              : "Excel file";
    const folderPath: ExecutionProjectFile[] = [];
    let folder = executionFolderId ? files.find((item) => item.id === executionFolderId && item.type === "folder") : undefined;
    const visited = new Set<string>();
    while (folder && !visited.has(folder.id)) {
      visited.add(folder.id);
      folderPath.unshift(folder);
      const parentId = folder.parentId;
      folder = parentId ? files.find((item) => item.id === parentId && item.type === "folder") : undefined;
    }
    return (
      <>
        <section className="page-heading execution-file-heading">
          <div>
            <button
              className="back-button"
              type="button"
              onClick={() => {
                setExecutionFolderId(null);
                setScreen("execution-projects");
              }}
            >
              All projects
            </button>
            <p className="eyebrow">Project files</p>
            <h1>{project.name}</h1>
            <p className="intro">{[project.client, project.company, project.location].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="execution-new-menu">
            <button
              className="primary-button"
              type="button"
              onClick={() => setExecutionNewMenuOpen((open) => !open)}
              aria-expanded={executionNewMenuOpen}
            >
              <Icon name="plus" size={16} /> New
            </button>
            {executionNewMenuOpen && (
              <div className="execution-new-options" role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setNewExecutionItemName("New folder");
                    setNewExecutionItemType("folder");
                    setExecutionNewMenuOpen(false);
                  }}
                >
                  <Icon name="folder" size={17} />
                  <span>
                    <b>Folder</b>
                    <small>Organize project files</small>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewExecutionItemName("New optimization and material order");
                    setNewExecutionItemType("optimization-material-order");
                    setExecutionNewMenuOpen(false);
                  }}
                >
                  <Icon name="box" size={17} />
                  <span>
                    <b>Optimization &amp; material order</b>
                    <small>Create one combined project file</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>
        <section className="file-explorer-panel">
          <nav className="file-breadcrumbs" aria-label="Folder path">
            <button type="button" onClick={() => setExecutionFolderId(null)}>
              Project files
            </button>
            {folderPath.map((item) => (
              <button type="button" key={item.id} onClick={() => setExecutionFolderId(item.id)}>
                <span>/</span>
                {item.name}
              </button>
            ))}
          </nav>
          <div className="file-explorer-list" role="table" aria-label={`${project.name} files`}>
            <div className="file-explorer-header" role="row">
              <span>Name</span>
              <span>Type</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {currentItems.map((item) => (
              <div className="file-explorer-row" role="row" key={item.id}>
                {item.type === "folder" ? (
                  <button
                    className="file-name-button"
                    type="button"
                    onDoubleClick={() => setExecutionFolderId(item.id)}
                    onClick={() => setExecutionFolderId(item.id)}
                  >
                    <Icon name="folder" size={20} />
                    <b>{item.name}</b>
                  </button>
                ) : item.type === "optimization-material-order" ? (
                  <button className="file-name-button" type="button" onClick={() => openExecutionWorkspace(item.id)}>
                    <Icon name="box" size={20} />
                    <b>{item.name}</b>
                  </button>
                ) : (
                  <span className="file-name">
                    <Icon name="box" size={20} />
                    <b>{item.name}</b>
                  </span>
                )}
                <span>{itemTypeLabel(item.type)}</span>
                <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.createdAt))}</span>
                <button
                  className="icon-button danger-icon"
                  type="button"
                  onClick={() => removeExecutionProjectItem(item.id)}
                  aria-label={`Delete ${item.name}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            {!currentItems.length && (
              <div className="file-explorer-empty">
                This folder is empty. Use New to create a folder or an optimization and material-order file.
              </div>
            )}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="execution-projects-app">
      <aside className="execution-projects-sidebar">
        <button
          className="execution-projects-brand"
          type="button"
          onClick={() => setScreen("home")}
          aria-label="Return to AMA services"
        >
          <Icon name="folder" size={22} />
          <span>
            AMA
            <br />
            Projects
          </span>
        </button>
        <nav aria-label="Projects navigation">
          <button
            className="active"
            type="button"
            onClick={() => {
              setExecutionFolderId(null);
              setScreen("execution-projects");
            }}
          >
            <Icon name="folder" /> <span>Projects</span>
          </button>
        </nav>
      </aside>
      <div className="execution-projects-content">
        <header className="execution-projects-topbar">
          <span>
            {screen === "execution-project-detail"
              ? executionProjects.find((p) => p.id === selectedExecutionProjectId)?.name ?? "Projects"
              : "Projects"}
          </span>
          <ProfileMenu />
        </header>
        <main>{screen === "execution-project-detail" ? <ExecutionProjectFiles /> : <ExecutionProjects />}</main>
      </div>
      {newExecutionItemType && (
        <div className="dialog-backdrop" onMouseDown={() => setNewExecutionItemType(null)}>
          <section
            className="material-dialog compact-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-item-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Project files</p>
                <h2 id="new-project-item-title">
                  New {newExecutionItemType === "folder" ? "folder" : "optimization and material-order file"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setNewExecutionItemType(null)}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={createExecutionProjectItem}>
              <div className="dialog-form">
                <label>
                  {newExecutionItemType === "folder" ? "Folder" : "Optimization and material-order file"} name <span>*</span>
                  <input
                    autoFocus
                    required
                    value={newExecutionItemName}
                    onChange={(event) => setNewExecutionItemName(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              </div>
              <div className="dialog-footer">
                <button className="secondary-button" type="button" onClick={() => setNewExecutionItemType(null)}>
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Create
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
