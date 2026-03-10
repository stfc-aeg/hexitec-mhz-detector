import type { AdapterEndpoint_t } from 'odin-react';
import { useState, useEffect, useCallback } from 'react';

type Point = [number, number];
type Region2D = [[number, number], [number, number]];
type Region1D = [number, number];

interface ClickableImageProps {
  endpoint: AdapterEndpoint_t;
  imgPath: string;
  coordsPath?: string;
  coordsParam?: string;
  onSelection?: (coords: [[number, number], [number, number]] | null) => void;
  maximiseAxis?: 'x' | 'y' | null;
  rectOutlineColour?: string;
  rectRgbaProperties?: string;
  rectDisappears?: boolean;
  region?: Region2D | Region1D | null;
}

export function ClickableImage(props: ClickableImageProps) {
  const {
    endpoint,
    imgPath,
    coordsPath,
    coordsParam,
    onSelection,
    maximiseAxis = null,
    rectOutlineColour='white', rectRgbaProperties='rgba(255,255,255,0.33)',
    rectDisappears = false,
    region=null
  } = props;
  
  const [imgData, changeImgData] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]);

  // this state and the region prop allow an optional external control of the drawn rectangle
  const [isInteracting, setIsInteracting] = useState(false);
  
  const refreshImage = useCallback(() => {
    endpoint.get<Blob>(imgPath, { responseType: "blob" })
      .then((result) => {
        if (imgData) { URL.revokeObjectURL(imgData); }
        const img_url = URL.createObjectURL(result);
        changeImgData(img_url);
      }).catch((error) => {
        console.error("IMAGE GET FAILED: ", error);
        changeImgData("");
      })
  }, [endpoint.updateFlag]);

  useEffect(() => {
    const timer_id = setInterval(refreshImage, 950);
    return () => clearInterval(timer_id);
  }, [refreshImage]);

  const getPoint = useCallback((e: React.MouseEvent<HTMLImageElement>): Point => {
    const bounds = e.currentTarget.getBoundingClientRect();
    return [e.clientX - bounds.left, e.clientY - bounds.top];
  }, []);

  // Draw a square if there are values and the user isn't currently drawing on the image
  useEffect(() => {
    if (isInteracting) return;

    if (!region) {
      setPoints([]);
      return;
    }

    const canvas = document.getElementById('canvas') as HTMLElement | null;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    let xMinNorm = 0, xMaxNorm = 1;
    let yMinNorm = 0, yMaxNorm = 1;

    // 2D region -- [[xMin, xMax], [yMin, yMax]]
    if (Array.isArray(region[0])) {
      const [[rxMin, rxMax], [ryMin, ryMax]] =
        region as [[number, number], [number, number]];

      xMinNorm = rxMin;
      xMaxNorm = rxMax;
      yMinNorm = ryMin;
      yMaxNorm = ryMax;
    }
    // 1D region -- [min, max]
    else {
      const [rMin, rMax] = region as [number, number];

      if (maximiseAxis === 'y') {
        xMinNorm = rMin;
        xMaxNorm = rMax;
        yMinNorm = 0;
        yMaxNorm = 1;
      } else if (maximiseAxis === 'x') {
        xMinNorm = 0;
        xMaxNorm = 1;
        yMinNorm = rMin;
        yMaxNorm = rMax;
      } else {
        // no maximiseAxis: ignore ambiguous 1D region
        return;
      }
    }

    const minX = xMinNorm * width;
    const maxX = xMaxNorm * width;
    const minY = yMinNorm * height;
    const maxY = yMaxNorm * height;

    setPoints([
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ]);
  }, [region, maximiseAxis, isInteracting]);


  const calculateRectangle = useCallback(() => {
    if (!startPoint || !endPoint) return;
    const xCoords = [startPoint[0], endPoint[0]];
    const yCoords = [startPoint[1], endPoint[1]];
    let minX = Math.min(...xCoords);
    let maxX = Math.max(...xCoords);
    let minY = Math.min(...yCoords);
    let maxY = Math.max(...yCoords);
    
    const canvas = document.getElementById('canvas') as HTMLElement | null;
    if (!canvas) return;
    
    if (maximiseAxis === 'x') {
      minX = 0;
      maxX = canvas.clientWidth;
    } else if (maximiseAxis === 'y') {
      minY = 0;
      maxY = canvas.clientHeight;
    }
    
    const rectanglePoints: Point[] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];
    setPoints(rectanglePoints);
  }, [startPoint, endPoint, maximiseAxis]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    // Clear selection on right click. If no selection, normal menu appears
    if (startPoint || endPoint || points.length > 0) {
      e.preventDefault();
      setStartPoint(null);
      setEndPoint(null);
      setIsInteracting(false);
      setPoints([]);

      if (!onSelection) { // in case there's no send function
        if (coordsParam && coordsPath) {
          const sendVal = {[coordsParam]: []};
          endpoint.put(sendVal, coordsPath);
        }
      } else {
        onSelection(null);
      }
    }
  }, [startPoint, endPoint, points]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsInteracting(true);
    const point = getPoint(e);
    setStartPoint(point);
    setEndPoint(point);
  }, [getPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (startPoint) {
      const point = getPoint(e);
      setEndPoint(point);
      calculateRectangle();
    }
  }, [startPoint, getPoint, calculateRectangle]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (!startPoint || !endPoint) return;
    
    calculateRectangle();
    const canvas = document.getElementById('canvas') as HTMLElement | null;
    if (!canvas) return;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    const x1 = endPoint[0] / width;
    const x2 = startPoint[0] / width;
    const y1 = endPoint[1] / height;
    const y2 = startPoint[1] / height;
    
    const coords: [[number, number], [number, number]] = [
      [Math.min(x1, x2), Math.max(x1, x2)],
      [Math.min(y1, y2), Math.max(y1, y2)]
    ];

    // If no selection function provided, send direct to endpoint
    if (!onSelection) {
      const sendVal = {[coordsParam]: coords};
      // console.log("sendval:", JSON.stringify(sendVal));
      endpoint.put(sendVal, coordsPath);
    }
    else {
      onSelection(coords);
    }
    
    setStartPoint(null);
    setEndPoint(null);
    setIsInteracting(false);
    if (rectDisappears) {
      setPoints([]);
    }
    
  }, [startPoint, endPoint, calculateRectangle]);

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      height: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      <img 
        src={imgData || undefined}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated',
        }}
        draggable="false"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        alt="Detector view"
      />
      <svg
        id="canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}>
        {points.length === 4 &&
          <polygon
            points={points.map(point => point.join(",")).join(" ")}
            style={{
              pointerEvents:'none', // Unclickable
              fill: rectRgbaProperties,
              stroke: rectOutlineColour // border
            }}
          />
        }
      </svg>
    </div>
  );
}
