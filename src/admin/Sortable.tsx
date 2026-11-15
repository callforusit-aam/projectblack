import type { ReactNode } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Ico, P } from './ui'


function Item({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const handle = (
    <button type="button" className="grip" aria-label="Trascina per riordinare" {...attributes} {...listeners}>
      <Ico d={P.grip} size={18} />
    </button>
  )
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 3 : undefined, opacity: isDragging ? 0.85 : 1, position: 'relative' }}>
      {children(handle)}
    </div>
  )
}

export function Sortable<T extends { id: string }>({ items, onReorder, render }: { items: T[]; onReorder: (next: T[]) => void; render: (item: T, handle: ReactNode) => ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = items.findIndex((i) => i.id === e.active.id), to = items.findIndex((i) => i.id === e.over!.id)
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((it) => <Item key={it.id} id={it.id}>{(handle) => render(it, handle)}</Item>)}
      </SortableContext>
    </DndContext>
  )
}
