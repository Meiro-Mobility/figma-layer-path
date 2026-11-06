# figma-layer-path

Find layers in a Figma node tree by layer path.

```typescript
import { findLayer } from "figma-layer-path";

const [instance] = figma.currentPage.selection;
if (instance?.type === "INSTANCE") {
  const label = findLayer(instance, ["card", "content", "footer", "primary-button", "label"]);
  if (label?.type === "TEXT") {
    console.log(label.characters);
  }
}
```
