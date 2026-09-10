import { CSSProperties } from "react";
import { number } from "../../../domain/calculations";
import type { CanvasItem } from "../../../domain/types";
import {
  FIXED_WINDOW_PAGE,
  FLY_SCREEN_PAGE,
  HINGE_WINDOW_PAGE,
  TECHNAL_ASSEMBLY_ID,
  TILT_AND_TURN_PAGE,
  TWO_RAIL_WINDOW_PAGE,
} from "../../catalog/domain/catalogDefinitions";
import { assemblyDefaultColor } from "../domain/projectDefaults";

export type TechnicalSymbolProps = {
  item: CanvasItem;
  selected: boolean;
  dimensionTextSize: number;
  glassName?: string;
  drawingName?: string;
  drawingReference?: number;
  onJoin?: () => void;
};

export function TechnicalSymbol({
  item,
  selected,
  dimensionTextSize,
  glassName,
  drawingName,
  drawingReference,
  onJoin,
}: TechnicalSymbolProps) {
  const width = item.inputWidth ?? 1500;
  const height = item.inputHeight ?? 1200;
  const name = item.name.toLowerCase();
  const isFlyScreen =
    item.assemblyPage === FLY_SCREEN_PAGE || item.sourceId === "fly-screen-2rail" || name.includes("fly screen");
  const isHingeWindow =
    item.assemblyPage === HINGE_WINDOW_PAGE ||
    item.sourceId === "hinged-window-soleal-fyn" ||
    name.includes("hinged window");
  const isFixedWindow =
    item.assemblyPage === FIXED_WINDOW_PAGE || item.sourceId === "fixed-window" || name.includes("fixed window");
  const isTiltAndTurn =
    item.assemblyPage === TILT_AND_TURN_PAGE ||
    item.sourceId === "tilt-and-turn-soleal-fyn" ||
    name.includes("tilt and turn");
  const isDoor = name.includes("door") || name.includes("hinge");
  const isSlider =
    !isFlyScreen &&
    !isFixedWindow &&
    !isTiltAndTurn &&
    (item.assemblyPage === TWO_RAIL_WINDOW_PAGE ||
      [TECHNAL_ASSEMBLY_ID, "soleal-gyn-2rail"].includes(item.sourceId) ||
      name.includes("slider") ||
      name.includes("sld") ||
      name.includes("soleal"));

  const frame = Math.min(55, width / 6, height / 6);
  const sash = Math.min(42, width / 8, height / 8);
  const mullion = Math.min(38, width / 10);
  const leafCount = isSlider ? (item.leaves === 3 || item.leaves === 4 ? item.leaves : 2) : 1;
  const clearWidth = Math.max(1, width - frame * 2 - mullion * (leafCount - 1));
  const glassWidth = clearWidth / leafCount;
  const glassHeight = Math.max(1, height - frame * 2 - sash * 2);
  const glassNameText = item.glassMaterialId ? glassName || item.glassLabel || "Glass" : "";
  const glassNameTextSize = Math.max(20, Math.min(78, Math.min(glassWidth, glassHeight) / 8));
  const drawingNameTextSize = Math.max(
    24,
    Math.min(120, Math.sqrt(width * height) / 10, ((width - frame * 2) * 1.45) / Math.max(12, drawingName?.length ?? 12))
  );
  const referenceDiameter = Math.max(184, Math.min(360, Math.sqrt(width * height) / 7));
  const referenceRadius = referenceDiameter / 2;
  const referenceX = Math.max(frame + referenceRadius, width - frame - referenceRadius);
  const referenceY = frame + referenceRadius;
  const sliderLeaves = Array.from({ length: leafCount }, (_, index) => {
    const sashX = frame + index * (glassWidth + mullion);
    return { sashX, glassX: sashX + sash, glassY: frame + sash };
  });
  const hingeLeafCount = isHingeWindow && item.leaves === 2 ? 2 : 1;
  const hingeLeafWidth = Math.max(1, (width - frame * 2) / hingeLeafCount);
  const hingeLeaves = Array.from({ length: hingeLeafCount }, (_, index) => {
    const sashX = frame + index * hingeLeafWidth;
    return { sashX, glassX: sashX + sash, glassY: frame + sash };
  });

  return (
    <g
      data-item-id={item.id}
      className={selected ? "technical-item selected" : "technical-item"}
      onDoubleClick={onJoin}
      onDoubleClickCapture={onJoin}
    >
      <svg
        x={item.x}
        y={item.y}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ "--window-colour": item.color ?? assemblyDefaultColor(item.sourceId) } as CSSProperties}
        aria-label={`${item.name}, ${width} by ${height} millimetres`}
      >
        {isFlyScreen ? (
          <>
            <rect x="0" y="0" width={width} height={height} className="tech-frame" />
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-mesh" />
            {Array.from({ length: 9 }, (_, index) => (
              <path
                key={index}
                d={`M${frame + ((width - frame * 2) * (index + 1)) / 10} ${frame}V${height - frame}M${frame} ${
                  frame + ((height - frame * 2) * (index + 1)) / 10
                }H${width - frame}`}
                className="tech-mesh-line"
              />
            ))}
          </>
        ) : isSlider ? (
          <>
            <rect x="0" y="0" width={width} height={height} className="tech-frame" />
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-void" />
            {sliderLeaves.map(({ sashX, glassX, glassY }, index) => (
              <g key={index}>
                <rect x={sashX} y={frame} width={glassWidth} height={height - frame * 2} className="tech-sash" />
                <rect
                  x={glassX}
                  y={glassY}
                  width={Math.max(1, glassWidth - sash * 2)}
                  height={glassHeight}
                  className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"}
                />
                {glassNameText && (
                  <text
                    x={glassX + 100}
                    y={glassY + 100}
                    textAnchor="start"
                    className="tech-glass-name"
                    style={{ fontSize: glassNameTextSize }}
                  >
                    {glassNameText}
                  </text>
                )}
                {index % 2 === 0 ? (
                  <>
                    <path
                      d={`M${sashX + glassWidth * 0.25} ${height / 2}H${sashX + glassWidth * 0.75}`}
                      className="tech-direction"
                    />
                    <path
                      d={`M${sashX + glassWidth * 0.75} ${height / 2}l-${sash * 0.6} -${sash * 0.45}M${
                        sashX + glassWidth * 0.75
                      } ${height / 2}l-${sash * 0.6} ${sash * 0.45}`}
                      className="tech-direction"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d={`M${sashX + glassWidth * 0.75} ${height / 2}H${sashX + glassWidth * 0.25}`}
                      className="tech-direction"
                    />
                    <path
                      d={`M${sashX + glassWidth * 0.25} ${height / 2}l${sash * 0.6} -${sash * 0.45}M${
                        sashX + glassWidth * 0.25
                      } ${height / 2}l${sash * 0.6} ${sash * 0.45}`}
                      className="tech-direction"
                    />
                  </>
                )}
              </g>
            ))}
            {sliderLeaves.slice(1).map(({ sashX }, index) => (
              <rect
                key={`mullion-${index}`}
                x={sashX - mullion}
                y={frame}
                width={mullion}
                height={height - frame * 2}
                className="tech-mullion"
              />
            ))}
            <path
              d={`M${frame} ${frame + sash}H${width - frame}M${frame} ${height - frame - sash}H${width - frame}`}
              className="tech-profile"
            />
          </>
        ) : isTiltAndTurn ? (
          <>
            <rect x="0" y="0" width={width} height={height} className="tech-frame" />
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-sash" />
            <rect
              x={frame + sash}
              y={frame + sash}
              width={Math.max(1, width - (frame + sash) * 2)}
              height={Math.max(1, height - (frame + sash) * 2)}
              className={item.glassMaterialId ? "tech-tilt-glass tech-glass-selected" : "tech-tilt-glass"}
            />
            {glassNameText && (
              <text
                x={frame + sash + 100}
                y={frame + sash + 100}
                textAnchor="start"
                className="tech-glass-name"
                style={{ fontSize: glassNameTextSize }}
              >
                {glassNameText}
              </text>
            )}
            <path
              d={`M${frame} ${frame}L${width - frame} ${height * 0.52}M${frame} ${height - frame}L${width / 2} ${frame}L${
                width - frame
              } ${height - frame}M${frame} ${height - frame}L${width - frame} ${height * 0.52}`}
              className="tech-hinge-direction"
            />
          </>
        ) : isHingeWindow ? (
          <>
            <rect x="0" y="0" width={width} height={height} className="tech-frame" />
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-void" />
            {hingeLeaves.map(({ sashX, glassX, glassY }, index) => (
              <g key={index}>
                <rect x={sashX} y={frame} width={hingeLeafWidth} height={height - frame * 2} className="tech-sash" />
                <rect
                  x={glassX}
                  y={glassY}
                  width={Math.max(1, hingeLeafWidth - sash * 2)}
                  height={glassHeight}
                  className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"}
                />
                {glassNameText && (
                  <text
                    x={glassX + 100}
                    y={glassY + 100}
                    textAnchor="start"
                    className="tech-glass-name"
                    style={{ fontSize: glassNameTextSize }}
                  >
                    {glassNameText}
                  </text>
                )}
                <path
                  d={
                    index === 0
                      ? `M${sashX + hingeLeafWidth - sash} ${height / 2}L${sashX + sash} ${frame + sash}M${
                          sashX + hingeLeafWidth - sash
                        } ${height / 2}L${sashX + sash} ${height - frame - sash}`
                      : `M${sashX + sash} ${height / 2}L${sashX + hingeLeafWidth - sash} ${frame + sash}M${
                          sashX + sash
                        } ${height / 2}L${sashX + hingeLeafWidth - sash} ${height - frame - sash}`
                  }
                  className="tech-hinge-direction"
                />
              </g>
            ))}
          </>
        ) : isFixedWindow ? (
          <>
            <rect x="0" y="0" width={width} height={height} className="tech-frame" />
            <rect
              x={frame}
              y={frame}
              width={width - frame * 2}
              height={height - frame * 2}
              className={item.glassMaterialId ? "tech-glass tech-glass-selected" : "tech-glass"}
            />
            {glassNameText && (
              <text
                x={frame + 100}
                y={frame + 100}
                textAnchor="start"
                className="tech-glass-name"
                style={{ fontSize: glassNameTextSize }}
              >
                {glassNameText}
              </text>
            )}
            <path
              d={`M${width / 2 - Math.min(width, height) / 12} ${height / 2}H${
                width / 2 + Math.min(width, height) / 12
              }M${width / 2} ${height / 2 - Math.min(width, height) / 12}V${height / 2 + Math.min(width, height) / 12}`}
              className="tech-profile"
            />
          </>
        ) : isDoor ? (
          <>
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-door" />
            <path
              d={`M${frame} ${height - frame}V${frame}M${frame} ${height - frame}A${width - frame * 2} ${
                height - frame * 2
              } 0 0 1 ${width - frame} ${frame}`}
              className="tech-profile"
            />
            <circle cx={width - frame * 1.8} cy={height / 2} r={Math.max(8, sash / 5)} className="tech-hardware" />
          </>
        ) : (
          <>
            <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} className="tech-glass" />
            <path
              d={`M${frame} ${height / 2}H${width - frame}M${width / 2} ${frame}V${height - frame}`}
              className="tech-profile"
            />
          </>
        )}
        {drawingName && (
          <text
            x={width / 2}
            y={height - frame - Math.max(20, sash * 0.65)}
            textAnchor="middle"
            className="tech-type-label"
            style={{ fontSize: drawingNameTextSize }}
          >
            {drawingName}
          </text>
        )}
        {drawingReference && (
          <g className="drawing-reference-marker">
            <circle cx={referenceX} cy={referenceY} r={referenceRadius} />
            <text
              x={referenceX}
              y={referenceY + referenceDiameter * 0.18}
              textAnchor="middle"
              style={{ fontSize: referenceDiameter * 0.58 }}
            >
              {drawingReference}
            </text>
          </g>
        )}
      </svg>
      <line
        x1={item.x}
        y1={item.y + height + 100}
        x2={item.x + width}
        y2={item.y + height + 100}
        className="dimension-line"
      />
      <text
        x={item.x + width / 2}
        y={item.y + height + 185}
        textAnchor="middle"
        className="dimension-text"
        style={{ fontSize: dimensionTextSize }}
      >
        {number(width)} mm
      </text>
      <text
        x={item.x - 75}
        y={item.y + height / 2}
        textAnchor="middle"
        className="dimension-text"
        style={{ fontSize: dimensionTextSize }}
        transform={`rotate(-90 ${item.x - 75} ${item.y + height / 2})`}
      >
        {number(height)} mm
      </text>
    </g>
  );
}
