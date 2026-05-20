import type React from "react";
import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItem {
  id: string;
  [key: string]: any;
}

interface DraggableListProps {
  items: SortableItem[];
  onReorder: (items: SortableItem[]) => void;
  renderItem: (item: SortableItem, index: number) => React.ReactNode;
}

function SortableItem({ item, renderItem, index }: { item: SortableItem; renderItem: (item: SortableItem, index: number) => React.ReactNode; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto" as any,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1">{renderItem(item, index)}</div>
    </div>
  );
}

export function DraggableList({ items, onReorder, renderItem }: DraggableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((i) => i.id);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [moved] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, moved);
    onReorder(newItems);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem key={item.id} item={item} index={index} renderItem={renderItem} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
