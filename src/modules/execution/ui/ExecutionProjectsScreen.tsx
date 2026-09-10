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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-5 pt-8 pb-7 md:px-12 md:pt-10">
        <div>
          <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
            Operational workspace
          </p>
          <h1 className="m-0 text-[#11262a] text-4xl tracking-[-0.035em] font-bold">
            Projects Under Execution
          </h1>
          <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-sm leading-relaxed">
            This workspace is separate from tender estimates, assemblies, and drawings.
          </p>
        </div>
        <button
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_rgba(22,78,77,0.18)] hover:bg-[#105d59] transition-colors cursor-pointer"
          onClick={() => openModal("executionProject")}
        >
          <Icon name="plus" /> New project
        </button>
      </section>
      <section className="grid gap-3.5 mx-5 md:mx-12 mb-9 min-h-[160px]">
        {executionProjects.length ? (
          executionProjects.map((proj) => (
            <article
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 border border-[#dfe8e8] rounded-[11px] bg-white shadow-[0_5px_18px_rgba(24,63,65,0.04)] hover:border-[#8dbdb8] transition-colors"
              key={proj.id}
            >
              <div>
                <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
                  {[proj.client, proj.company, proj.location].filter(Boolean).join(" · ") || "No project details"}
                </p>
                <h2 className="mt-[3px] mb-1.5 text-[19px] font-bold text-[#183f41]">{proj.name}</h2>
                <p className="m-0 text-[#6b8185] text-[13px]">
                  Created {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(proj.createdAt))}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_rgba(22,78,77,0.18)] hover:bg-[#105d59] transition-colors cursor-pointer"
                  onClick={() => openExecutionProject(proj.id)}
                >
                  Open project <Icon name="arrow" size={16} />
                </button>
                <button
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] transition-colors cursor-pointer"
                  onClick={() => copyExecutionProject(proj.id)}
                >
                  <Icon name="copy" size={16} /> Copy project
                </button>
                <button
                  className="w-[38px] h-[38px] grid place-items-center rounded-[7px] border-0 bg-transparent text-[#577176] hover:bg-[#f9e8e8] hover:text-[#a52f2f] transition-colors cursor-pointer"
                  onClick={() => removeExecutionProject(proj.id)}
                  aria-label={`Delete ${proj.name}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="m-0 p-10 border border-dashed border-[#b8d1d3] rounded-[10px] bg-white text-[#607d80] text-center text-sm">
            No projects under execution yet. Create one to start tracking it here.
          </p>
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
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-5 pt-8 pb-7 md:px-12 md:pt-10">
          <div>
            <button
              className="inline-flex items-center gap-1.5 mb-4 border-0 bg-transparent p-0 text-[#246c68] text-[13px] font-bold cursor-pointer hover:underline"
              type="button"
              onClick={() => {
                setExecutionFolderId(null);
                setScreen("execution-projects");
              }}
            >
              ← All projects
            </button>
            <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">Project files</p>
            <h1 className="m-0 text-[#11262a] text-4xl tracking-[-0.035em] font-bold">{project.name}</h1>
            <p className="max-w-[650px] mt-2.5 mb-0 text-[#5e7478] text-sm leading-relaxed">{[project.client, project.company, project.location].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="relative">
            <button
              className="min-h-[42px] min-w-[104px] inline-flex items-center justify-center gap-2 px-4 rounded-lg font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_rgba(22,78,77,0.18)] hover:bg-[#105d59] transition-colors cursor-pointer"
              type="button"
              onClick={() => setExecutionNewMenuOpen((open) => !open)}
              aria-expanded={executionNewMenuOpen}
            >
              <Icon name="plus" size={16} /> New
            </button>
            {executionNewMenuOpen && (
              <div className="absolute z-20 top-[calc(100%+8px)] right-0 grid w-[290px] p-1.5 border border-[#bfd3d4] rounded-[10px] bg-white shadow-[0_14px_34px_rgba(23,61,64,0.2)]" role="menu">
                <button
                  type="button"
                  className="flex items-center gap-3 p-2.5 border-0 rounded-[7px] bg-white text-[#244d50] text-left hover:bg-[#e9f5f3] cursor-pointer transition-colors"
                  onClick={() => {
                    setNewExecutionItemName("New folder");
                    setNewExecutionItemType("folder");
                    setExecutionNewMenuOpen(false);
                  }}
                >
                  <span className="text-[#18766f] flex-none flex items-center">
                    <Icon name="folder" size={17} />
                  </span>
                  <span className="grid gap-0.5">
                    <b className="text-[13px]">Folder</b>
                    <small className="text-[#71888a] text-[11px]">Organize project files</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 p-2.5 border-0 rounded-[7px] bg-white text-[#244d50] text-left hover:bg-[#e9f5f3] cursor-pointer transition-colors"
                  onClick={() => {
                    setNewExecutionItemName("New optimization and material order");
                    setNewExecutionItemType("optimization-material-order");
                    setExecutionNewMenuOpen(false);
                  }}
                >
                  <span className="text-[#18766f] flex-none flex items-center">
                    <Icon name="box" size={17} />
                  </span>
                  <span className="grid gap-0.5">
                    <b className="text-[13px]">Optimization &amp; material order</b>
                    <small className="text-[#71888a] text-[11px]">Create one combined project file</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>
        <section className="mx-5 md:mx-12 mb-10 overflow-hidden border border-[#ceddde] rounded-[11px] bg-white shadow-[0_6px_20px_rgba(24,63,65,0.07)] overflow-x-auto">
          <nav className="flex items-center min-h-[50px] px-4 py-2 border-b border-[#dce7e8] bg-[#f9fbfb]" aria-label="Folder path">
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 border-0 bg-transparent text-[#236d6a] text-[13px] font-extrabold cursor-pointer hover:text-[#104d4b] hover:underline"
              onClick={() => setExecutionFolderId(null)}
            >
              Project files
            </button>
            {folderPath.map((item) => (
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 border-0 bg-transparent text-[#236d6a] text-[13px] font-extrabold cursor-pointer hover:text-[#104d4b] hover:underline"
                key={item.id}
                onClick={() => setExecutionFolderId(item.id)}
              >
                <span className="text-[#91a5a7]">/</span>
                {item.name}
              </button>
            ))}
          </nav>
          <div className="min-w-[660px]" role="table" aria-label={`${project.name} files`}>
            <div className="grid grid-cols-[minmax(260px,2fr)_110px_150px_70px] items-center gap-3.5 px-4 py-2.5 bg-[#173f43] text-[#eaf6f5] text-[11px] font-extrabold uppercase tracking-wider" role="row">
              <span>Name</span>
              <span>Type</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {currentItems.map((item) => (
              <div className="grid grid-cols-[minmax(260px,2fr)_110px_150px_70px] items-center gap-3.5 min-h-[58px] px-4 py-2.5 border-t border-[#e0e9ea] text-[#587175] text-[13px] hover:bg-[#f5faf9] transition-colors" role="row" key={item.id}>
                {item.type === "folder" ? (
                  <button
                    className="flex items-center gap-2.5 min-w-0 p-0 border-0 bg-transparent text-[#244d50] text-left cursor-pointer hover:underline [&>svg]:flex-none [&>svg]:text-[#27827d]"
                    type="button"
                    onDoubleClick={() => setExecutionFolderId(item.id)}
                    onClick={() => setExecutionFolderId(item.id)}
                  >
                    <Icon name="folder" size={20} />
                    <b className="truncate">{item.name}</b>
                  </button>
                ) : item.type === "optimization-material-order" ? (
                  <button
                    className="flex items-center gap-2.5 min-w-0 p-0 border-0 bg-transparent text-[#244d50] text-left cursor-pointer hover:underline [&>svg]:flex-none [&>svg]:text-[#27827d]"
                    type="button"
                    onClick={() => openExecutionWorkspace(item.id)}
                  >
                    <Icon name="box" size={20} />
                    <b className="truncate">{item.name}</b>
                  </button>
                ) : (
                  <span className="flex items-center gap-2.5 min-w-0 text-[#244d50] [&>svg]:flex-none [&>svg]:text-[#27827d]">
                    <Icon name="box" size={20} />
                    <b className="truncate">{item.name}</b>
                  </span>
                )}
                <span>{itemTypeLabel(item.type)}</span>
                <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.createdAt))}</span>
                <button
                  className="w-[38px] h-[38px] grid place-items-center rounded-[7px] border-0 bg-transparent text-[#577176] hover:bg-[#f9e8e8] hover:text-[#a52f2f] transition-colors cursor-pointer"
                  type="button"
                  onClick={() => removeExecutionProjectItem(item.id)}
                  aria-label={`Delete ${item.name}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            {!currentItems.length && (
              <div className="grid justify-items-center gap-3 p-10 px-5 text-[#70888b] text-center text-[13px]">
                This folder is empty. Use New to create a folder or an optimization and material-order file.
              </div>
            )}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7f8]">
      <aside className="flex flex-col flex-[0_0_224px] max-[760px]:flex-[0_0_76px] p-7 px-[15px] max-[760px]:py-6 max-[760px]:px-2.5 bg-[#123b40] text-[#d9e6e7]">
        <button
          className="flex items-center gap-2.5 self-start max-[760px]:justify-center mb-[42px] p-0 border-0 bg-transparent text-white text-left text-lg font-extrabold leading-none cursor-pointer [&>svg]:text-[#82d4c9]"
          type="button"
          onClick={() => setScreen("home")}
          aria-label="Return to AMA services"
        >
          <Icon name="folder" size={22} />
          <span className="max-[760px]:hidden">
            AMA
            <br />
            Projects
          </span>
        </button>
        <nav className="grid gap-1.5" aria-label="Projects navigation">
          <button
            className="flex items-center gap-2.5 max-[760px]:justify-center w-full p-2.5 border-0 rounded-lg bg-[#28636a] text-white text-left text-sm font-bold cursor-pointer"
            type="button"
            onClick={() => {
              setExecutionFolderId(null);
              setScreen("execution-projects");
            }}
          >
            <Icon name="folder" /> <span className="max-[760px]:hidden">Projects</span>
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between h-[69px] px-12 max-[760px]:px-5 border-b border-[#e0e8e9] bg-white text-[#284d51] text-sm font-extrabold">
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
        <div
          className="fixed inset-0 z-20 grid place-items-center p-6 bg-[#0f282a8c]"
          onMouseDown={() => setNewExecutionItemType(null)}
        >
          <section
            className="w-[min(460px,100%)] rounded-[13px] bg-white shadow-[0_25px_75px_#00000047]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-item-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-[20px_25px] border-b border-[#e3ebeb]">
              <div>
                <p className="m-0 mb-1.5 text-[#23736f] text-[11px] font-extrabold uppercase tracking-[0.09em]">
                  Project files
                </p>
                <h2 id="new-project-item-title" className="m-0 text-[#1a3539] text-[21px] font-bold">
                  New {newExecutionItemType === "folder" ? "folder" : "optimization and material-order file"}
                </h2>
              </div>
              <button
                className="grid place-items-center w-8 h-8 p-0 border border-[#cbd9db] rounded-md bg-transparent text-[#4c696d] hover:bg-[#edf4f4] cursor-pointer"
                type="button"
                onClick={() => setNewExecutionItemType(null)}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={createExecutionProjectItem}>
              <div className="grid gap-[15px] p-[25px]">
                <label className="grid gap-1.5 text-[#4c696d] text-xs font-[750]">
                  <span>
                    {newExecutionItemType === "folder" ? "Folder" : "Optimization and material-order file"} name{" "}
                    <span className="text-[#b73030]">*</span>
                  </span>
                  <input
                    className="w-full h-[39px] px-2.5 border border-[#cbd9db] rounded-md bg-white text-[#19363a] text-sm focus:border-[#27827d] focus:outline-none"
                    autoFocus
                    required
                    value={newExecutionItemName}
                    onChange={(event) => setNewExecutionItemName(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-[9px] p-[20px_25px] border-t border-[#e3ebeb]">
                <button
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#cad9da] bg-white text-[#345156] hover:bg-[#f0f6f6] cursor-pointer transition-colors"
                  type="button"
                  onClick={() => setNewExecutionItemType(null)}
                >
                  Cancel
                </button>
                <button
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[8px] font-bold border border-[#146c68] bg-[#176f6b] text-white shadow-[0_2px_5px_#164e4d2e] hover:bg-[#105d59] cursor-pointer transition-colors"
                  type="submit"
                >
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
