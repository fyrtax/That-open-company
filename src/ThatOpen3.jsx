import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as FRAGS from "@thatopen/fragments"
import {useEffect, useRef} from "react";

export function ThatOpen3() {
    const containerRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create();

        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;

        world.renderer = new OBC.SimpleRenderer(components, containerRef.current);

        world.camera = new OBC.SimpleCamera(components);
        world.camera.controls.setLookAt(74, 16, 0.2, 30, -4, 27); // convenient position for the model we will load

        components.init();

        const grids = components.get(OBC.Grids);
        grids.create(world);

        const workerUrl = "assets/worker.mjs";
        const fragments = new FRAGS.FragmentsModels(workerUrl);
        world.camera.controls.addEventListener("rest", () => fragments.update(true));

        const serializer = new FRAGS.IfcImporter();
        serializer.wasm = {absolute: true, path: "https://unpkg.com/web-ifc@0.0.72/"};
        // A convenient variable to hold the ArrayBuffer data loaded into memory
        let fragmentBytes = null;
        let onConversionFinish = () => {
        };

        const convertIFC = async () => {
            // const url = "https://thatopen.github.io/engine_fragment/resources/ifc/school_str.ifc";
            const url = "assets/Projekt1.ifc";
            const ifcFile = await fetch(url);
            const ifcBuffer = await ifcFile.arrayBuffer();
            const ifcBytes = new Uint8Array(ifcBuffer);
            fragmentBytes = await serializer.process({
                bytes: ifcBytes,
                progressCallback: (progress, data) => console.log(progress, data),
            });
            onConversionFinish();
        };

        const loadModel = async () => {
            if (!fragmentBytes) return;
            const model = await fragments.load(fragmentBytes, { modelId: "example" });
            model.useCamera(world.camera.three);
            world.scene.three.add(model.object);
            await fragments.update(true);
        };

        const removeModel = async () => {
            await fragments.disposeModel("example");
        };

        BUI.Manager.init();

        const [panel, updatePanel] = BUI.Component.create(
            (_) => {
                const onDownload = () => {
                    if (!fragmentBytes) return;
                    const file = new File([fragmentBytes], "sample.frag");
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(file);
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(a.href);
                };

                let content = BUI.html`
                    <bim-label style="white-space: normal;">💡 Open the console to see more information</bim-label>
                    <bim-button label="Load IFC" @click=${convertIFC}></bim-button>
                `;
                if (fragmentBytes) {
                    content = BUI.html`
                        <bim-label style="white-space: normal;">🚀 The IFC has been converted to Fragments binary data. Add the model to the scene!</bim-label>
                        <bim-button label="Add Model" @click=${loadModel}></bim-button>
                        <bim-button label="Remove Model" @click=${removeModel}></bim-button>
                        <bim-button label="Download Fragments" @click=${onDownload}></bim-button>
                    `;
                }

                return BUI.html`
                    <bim-panel id="controls-panel" active label="IFC Importer" class="options-menu">
                        <bim-panel-section label="Controls">
                            ${content}
                        </bim-panel-section>
                    </bim-panel>
                `;
            },
            {},
        );

        onConversionFinish = () => updatePanel();
        fragments.models.list.onItemDeleted.add(() => updatePanel());

        panelRef.current.append(panel);

        return () => {
            components.dispose();
            if (panelRef.current) {
                panelRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <main
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute'
            }}
        >
            <div
                ref={panelRef}
                style={{
                    position: 'absolute',
                    zIndex: 11,
                }}
            ></div>

            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    zIndex: 10,
                }}
            ></div>
        </main>
    );
}
