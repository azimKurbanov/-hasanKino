"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MovieCard from "./MovieCard";

const GRID_GAP = 24;
const OVERSCAN_ROWS = 2;

function getColumnCount(width) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

export default function VirtualMovieGrid({
  items,
  type = "movie",
  resolveType,
  className = "",
  threshold = 18,
}) {
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({
    width: 0,
    scrollTop: 0,
    viewportHeight: 0,
    top: 0,
  });

  useEffect(() => {
    const updateMeasurements = () => {
      const nextWidth = containerRef.current?.clientWidth || window.innerWidth;
      const nextTop = containerRef.current
        ? containerRef.current.getBoundingClientRect().top + window.scrollY
        : 0;
      setViewport({
        width: nextWidth,
        scrollTop: window.scrollY,
        viewportHeight: window.innerHeight,
        top: nextTop,
      });
    };

    updateMeasurements();

    const onScroll = () => {
      setViewport((prev) => ({ ...prev, scrollTop: window.scrollY }));
    };

    const resizeObserver = new ResizeObserver(updateMeasurements);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMeasurements);
    };
  }, []);

  const virtualization = useMemo(() => {
    if (!items?.length) {
      return {
        columns: 2,
        visibleItems: [],
        paddingTop: 0,
        totalHeight: 0,
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      };
    }

    const columns = getColumnCount(viewport.width);
    const cardWidth = Math.max((viewport.width - GRID_GAP * (columns - 1)) / columns, 140);
    const rowHeight = cardWidth * 1.64 + 74;
    const rowCount = Math.ceil(items.length / columns);
    const relativeScroll = Math.max(viewport.scrollTop - viewport.top, 0);
    const startRow = Math.max(Math.floor(relativeScroll / rowHeight) - OVERSCAN_ROWS, 0);
    const visibleRowCount = Math.ceil(viewport.viewportHeight / rowHeight) + OVERSCAN_ROWS * 2;
    const endRow = Math.min(startRow + visibleRowCount, rowCount);
    const startIndex = startRow * columns;
    const endIndex = Math.min(endRow * columns, items.length);

    return {
      columns,
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      paddingTop: startRow * rowHeight,
      totalHeight: rowCount * rowHeight,
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    };
  }, [items, viewport]);

  if (!items?.length) return null;

  if (items.length <= threshold) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: `${GRID_GAP}px`,
        }}
      >
        {items.map((item) => (
          <MovieCard
            key={`${resolveType ? resolveType(item) : type}-${item.id}`}
            movie={item}
            type={resolveType ? resolveType(item) : type}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: `${virtualization.totalHeight}px`, position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${virtualization.paddingTop}px)`,
          display: "grid",
          gridTemplateColumns: virtualization.gridTemplateColumns,
          gap: `${GRID_GAP}px`,
          willChange: "transform",
        }}
      >
        {virtualization.visibleItems.map((item) => (
          <MovieCard
            key={`${resolveType ? resolveType(item) : type}-${item.id}`}
            movie={item}
            type={resolveType ? resolveType(item) : type}
          />
        ))}
      </div>
    </div>
  );
}
