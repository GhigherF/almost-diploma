import React, { useState, useEffect, useCallback } from 'react';

const PREVIEW_SIZE = 120;
const OUTPUT_SIZE = 256;

export default function AvatarCropModal({ imageUrl, onConfirm, onCancel }) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const fitScale = imgSize.w && imgSize.h
    ? Math.max(PREVIEW_SIZE / imgSize.w, PREVIEW_SIZE / imgSize.h)
    : 1;
  const effectiveScale = fitScale * scale;
  const displayW = imgSize.w * effectiveScale;
  const displayH = imgSize.h * effectiveScale;

  const clampOffset = useCallback((ox, oy) => {
    const maxX = Math.max(0, (displayW - PREVIEW_SIZE) / 2);
    const maxY = Math.max(0, (displayH - PREVIEW_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [displayW, displayH]);

  const generateCropped = useCallback(() => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        const cropSizeInImage = PREVIEW_SIZE / effectiveScale;
        const sx = Math.max(0, Math.min(
          img.naturalWidth - cropSizeInImage,
          (img.naturalWidth / 2) - cropSizeInImage / 2 - offsetX / effectiveScale
        ));
        const sy = Math.max(0, Math.min(
          img.naturalHeight - cropSizeInImage,
          (img.naturalHeight / 2) - cropSizeInImage / 2 - offsetY / effectiveScale
        ));
        ctx.drawImage(img, sx, sy, cropSizeInImage, cropSizeInImage, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
      };
      img.src = imageUrl;
    });
  }, [imageUrl, effectiveScale, offsetX, offsetY]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetX(prev => clampOffset(prev + deltaX, offsetY).x);
    setOffsetY(prev => clampOffset(offsetX, prev + deltaY).y);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, offsetX, offsetY, clampOffset]);

  useEffect(() => {
    const clamped = clampOffset(offsetX, offsetY);
    if (clamped.x !== offsetX) setOffsetX(clamped.x);
    if (clamped.y !== offsetY) setOffsetY(clamped.y);
  }, [scale, displayW, displayH]);

  const handleConfirm = async () => {
    const blob = await generateCropped();
    if (blob) {
      const preview = URL.createObjectURL(blob);
      onConfirm({ blob, preview });
    }
  };

  const imgLeft = (PREVIEW_SIZE - displayW) / 2 + offsetX;
  const imgTop = (PREVIEW_SIZE - displayH) / 2 + offsetY;

  return (
    <div className="avatar-crop-modal" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="avatar-crop-modal-content">
        <h3 className="avatar-crop-modal-title">Обрезать аватар</h3>
        <p className="avatar-crop-hint">Результат отобразится в шапке профиля после сохранения.</p>

        <div className="avatar-crop-container avatar-crop-container--single">
          <div
            className="avatar-crop-preview"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            {imgSize.w > 0 && (
              <img
                src={imageUrl}
                alt="crop"
                draggable={false}
                style={{
                  position: 'absolute',
                  width: displayW,
                  height: displayH,
                  left: imgLeft,
                  top: imgTop,
                  maxWidth: 'none',
                  userSelect: 'none',
                }}
              />
            )}
            <div className="avatar-crop-guide" />
          </div>
        </div>

        <div className="avatar-crop-controls">
          <div className="avatar-crop-control-group">
            <div className="avatar-crop-control-label">
              Масштаб: {(scale * 100).toFixed(0)}%
            </div>
            <input
              type="range"
              className="avatar-crop-slider"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="avatar-crop-buttons">
          <button type="button" className="avatar-crop-btn" onClick={onCancel}>Отмена</button>
          <button type="button" className="avatar-crop-btn primary" onClick={handleConfirm}>Применить</button>
        </div>
      </div>
    </div>
  );
}
