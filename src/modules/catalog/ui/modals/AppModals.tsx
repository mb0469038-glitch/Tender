import type { Assembly, CompanyDatabase, Material } from "../../../../domain/types";
import type { useModalManager } from "../../application/useModalManager";
import type { useCanvasInteraction } from "../../../projects/application/useCanvasInteraction";
import { companyTableReferencePrefix } from "../../application/useModalManager";
import { ReferenceConflictModal } from "../../../projects/ui/modals/ReferenceConflictModal";
import { ProjectModal } from "../../../projects/ui/modals/ProjectModal";
import { MaterialModal } from "./MaterialModal";
import { AssemblyModal } from "./AssemblyModal";
import {
  NewDatabaseModal,
  NewCompanyDatabaseModal,
  NewCompanyTableModal,
  MoveCompanyTableModal,
} from "./CompanyDatabaseModals";

export type AppModalsProps = {
  modals: ReturnType<typeof useModalManager>;
  canvasInteraction: ReturnType<typeof useCanvasInteraction>;
  assemblies: Assembly[];
  materials: Material[];
  companyDatabases: CompanyDatabase[];
  materialDatabaseReference: (material: Material) => string;
  activeDatabaseId: string;
  workspaceSaveStatus?: "saved" | "saving" | "error" | "idle";
};

export function AppModals({
  modals,
  canvasInteraction,
  assemblies,
  materials,
  companyDatabases,
  materialDatabaseReference,
  activeDatabaseId,
  workspaceSaveStatus,
}: AppModalsProps) {
  return (
    <>
      {canvasInteraction.referenceConflict && (
        <ReferenceConflictModal
          requestedReference={canvasInteraction.referenceConflict.requestedReference}
          onClose={() => canvasInteraction.setReferenceConflict(null)}
          onRename={() => {
            canvasInteraction.setReferenceConflict(null);
            canvasInteraction.setOpeningNameError("Choose another positive reference number.");
          }}
          onShift={canvasInteraction.shiftReferencesForConflict}
        />
      )}

      <ProjectModal
        isOpen={modals.modal?.type === "project" || modals.modal?.type === "executionProject"}
        isEdit={Boolean(modals.modal?.id)}
        isExecutionProject={modals.modal?.type === "executionProject"}
        formName={modals.formName}
        setFormName={modals.setFormName}
        formClient={modals.formClient}
        setFormClient={modals.setFormClient}
        formCompany={modals.formCompany}
        setFormCompany={modals.setFormCompany}
        formLocation={modals.formLocation}
        setFormLocation={modals.setFormLocation}
        onClose={modals.closeModal}
        onSave={modals.save}
      />

      <MaterialModal
        isOpen={modals.modal?.type === "material"}
        isEdit={Boolean(modals.modal?.id)}
        isGlass={activeDatabaseId === "glass"}
        materialScopeTitle={modals.materialScopeTitle}
        materialScopeManufacturer={modals.materialScopeManufacturer}
        materialScopeId={modals.materialScopeId}
        materialPriceTable={modals.materialPriceTable}
        setMaterialPriceTable={modals.setMaterialPriceTable}
        formName={modals.formName}
        setFormName={modals.setFormName}
        formCode={modals.formCode}
        setFormCode={modals.setFormCode}
        materialCodeError={modals.materialCodeError}
        setMaterialCodeError={modals.setMaterialCodeError}
        formCategory={modals.formCategory}
        setFormCategory={modals.setFormCategory}
        unit={modals.unit}
        setUnit={modals.setUnit}
        cost={modals.cost}
        setCost={modals.setCost}
        glassDescription={modals.glassDescription}
        setGlassDescription={modals.setGlassDescription}
        glassThickness={modals.glassThickness}
        setGlassThickness={modals.setGlassThickness}
        options={modals.options}
        setOptions={modals.setOptions}
        materialSketch={modals.materialSketch}
        setMaterialSketch={modals.setMaterialSketch}
        materialPenPoints={modals.materialPenPoints}
        materialDrawStart={modals.materialDrawStart}
        materialDrawMove={modals.materialDrawMove}
        materialDrawEnd={modals.materialDrawEnd}
        pasteMaterialPhoto={modals.pasteMaterialPhoto}
        setMaterialPhoto={modals.setMaterialPhoto}
        onClose={modals.closeModal}
        onSave={modals.save}
      />

      <AssemblyModal
        isOpen={modals.modal?.type === "assembly"}
        modalId={modals.modal?.id}
        formName={modals.formName}
        setFormName={modals.setFormName}
        formCode={modals.formCode}
        setFormCode={modals.setFormCode}
        formCategory={modals.formCategory}
        setFormCategory={modals.setFormCategory}
        formManufacturer={modals.formManufacturer}
        setFormManufacturer={modals.setFormManufacturer}
        assemblyColor={modals.assemblyColor}
        setAssemblyColor={modals.setAssemblyColor}
        copyFromAssemblyOpen={modals.copyFromAssemblyOpen}
        setCopyFromAssemblyOpen={modals.setCopyFromAssemblyOpen}
        copyAssemblyContentFrom={modals.copyAssemblyContentFrom}
        assemblies={assemblies}
        materials={materials}
        materialDatabaseReference={materialDatabaseReference}
        assemblyFormulaValuesForEditor={modals.assemblyFormulaValuesForEditor}
        assemblyCanvasDefaults={modals.assemblyCanvasDefaults}
        setAssemblyCanvasDefaults={modals.setAssemblyCanvasDefaults}
        assemblyColumnWidths={modals.assemblyColumnWidths}
        startAssemblyColumnResize={modals.startAssemblyColumnResize}
        resizeAssemblyColumn={modals.resizeAssemblyColumn}
        setAssemblyColumnResize={modals.setAssemblyColumnResize}
        partIds={modals.partIds}
        setPartIds={modals.setPartIds}
        partMaterialIds={modals.partMaterialIds}
        partFormulas={modals.partFormulas}
        setPartFormulas={modals.setPartFormulas}
        partFourPanelFormulas={modals.partFourPanelFormulas}
        setPartFourPanelFormulas={modals.setPartFourPanelFormulas}
        partConditions={modals.partConditions}
        setPartConditions={modals.setPartConditions}
        moveMaterialId={modals.moveMaterialId}
        setMoveMaterialId={modals.setMoveMaterialId}
        moveAssemblyPartAfter={modals.moveAssemblyPartAfter}
        photoMenuMaterialId={modals.photoMenuMaterialId}
        setPhotoMenuMaterialId={modals.setPhotoMenuMaterialId}
        insertAfterMaterialId={modals.insertAfterMaterialId}
        setInsertAfterMaterialId={modals.setInsertAfterMaterialId}
        insertMaterialCode={modals.insertMaterialCode}
        setInsertMaterialCode={modals.setInsertMaterialCode}
        addAssemblyPartByCode={modals.addAssemblyPartByCode}
        activeFormulaField={modals.activeFormulaField}
        setActiveFormulaField={modals.setActiveFormulaField}
        beginFormulaEdit={modals.beginFormulaEdit}
        cancelFormulaEdit={modals.cancelFormulaEdit}
        setFormulaEditBackup={modals.setFormulaEditBackup}
        insertFormulaValue={modals.insertFormulaValue}
        activeConditionMaterialId={modals.activeConditionMaterialId}
        setActiveConditionMaterialId={modals.setActiveConditionMaterialId}
        conditionEditBackup={modals.conditionEditBackup}
        setConditionEditBackup={modals.setConditionEditBackup}
        insertConditionToken={modals.insertConditionToken}
        frameTypes={modals.frameTypes}
        setFrameTypes={modals.setFrameTypes}
        nameRules={modals.nameRules}
        setNameRules={modals.setNameRules}
        realJoinPropertyMatches={modals.realJoinPropertyMatches}
        fakeJoinPropertyMatches={modals.fakeJoinPropertyMatches}
        updateJoinPropertyMatch={modals.updateJoinPropertyMatch}
        removeJoinPropertyMatch={modals.removeJoinPropertyMatch}
        addJoinPropertyMatch={modals.addJoinPropertyMatch}
        activeDatabaseId={activeDatabaseId}
        joinModifications={modals.joinModifications}
        setJoinModifications={modals.setJoinModifications}
        assemblyReferenceImage={modals.assemblyReferenceImage}
        setAssemblyReferenceImage={modals.setAssemblyReferenceImage}
        assemblyAutoSaveStatus={modals.assemblyAutoSaveStatus}
        workspaceSaveStatus={workspaceSaveStatus}
        onClose={modals.closeModal}
        onSave={modals.save}
      />

      <NewDatabaseModal
        parent={modals.newDatabaseParent}
        name={modals.newDatabaseName}
        setName={modals.setNewDatabaseName}
        onClose={() => modals.setNewDatabaseParent(null)}
        onSubmit={modals.saveNewDatabase}
      />

      <NewCompanyDatabaseModal
        isOpen={modals.newCompanyDatabaseOpen}
        name={modals.newCompanyDatabaseName}
        setName={modals.setNewCompanyDatabaseName}
        error={modals.newCompanyDatabaseError}
        setError={modals.setNewCompanyDatabaseError}
        onClose={() => modals.setNewCompanyDatabaseOpen(false)}
        onSubmit={modals.saveNewCompanyDatabase}
      />

      <NewCompanyTableModal
        tableFor={modals.newCompanyTableFor}
        name={modals.newCompanyTableName}
        setName={modals.setNewCompanyTableName}
        reference={modals.newCompanyTableReference}
        setReference={modals.setNewCompanyTableReference}
        error={modals.newCompanyTableError}
        setError={modals.setNewCompanyTableError}
        referencePrefix={companyTableReferencePrefix}
        onClose={() => modals.setNewCompanyTableFor(null)}
        onSubmit={modals.saveNewCompanyTable}
      />

      <MoveCompanyTableModal
        moveTable={modals.moveCompanyTable}
        targetId={modals.moveCompanyTableTargetId}
        setTargetId={modals.setMoveCompanyTableTargetId}
        databases={[{ id: "prices", name: "Soleal" }, ...companyDatabases].filter(
          (database) => database.id !== modals.moveCompanyTable?.sourceDatabaseId
        )}
        onClose={() => modals.setMoveCompanyTable(null)}
        onSubmit={modals.saveMoveCompanyTable}
      />
    </>
  );
}
