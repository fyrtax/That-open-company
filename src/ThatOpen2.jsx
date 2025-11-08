import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import {useEffect, useRef} from "react";

export function ThatOpen2() {
    const containerRef = useRef(null);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);

        const world = worlds.create();

        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
        world.camera = new OBC.SimpleCamera(components);

        components.init();
        world.scene.setup();
        world.scene.three.background = null;

        const workerUrl = "assets/worker.mjs";
        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(workerUrl);

        world.camera.controls.addEventListener("rest", () =>
            fragments.core.update(true),
        );

        fragments.list.onItemSet.add(({value: model}) => {
            model.useCamera(world.camera.three);
            world.scene.three.add(model.object);
            fragments.core.update(true);
        });

        const loadModel = async () => {
            const fragPaths = ["https://thatopen.github.io/engine_components/resources/frags/school_arq.frag"];
            await Promise.all(
                fragPaths.map(async (path) => {
                    const modelId = path.split("/").pop()?.split(".").shift();
                    if (!modelId) return null;
                    const file = await fetch(path);
                    const buffer = await file.arrayBuffer();
                    return fragments.core.load(buffer, {modelId});
                }),
            );

            await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);
            await fragments.core.update(true);
        };

        loadModel();

        BUI.Manager.init();

        const handleBackgroundColorChange = ({target}) => {
            world.scene.config.backgroundColor = new THREE.Color(target.color);
        };

        const handleDirectionalLightChange = ({target}) => {
            world.scene.config.directionalLight.intensity = target.value;
        };

        const handleAmbientLightChange = ({target}) => {
            world.scene.config.ambientLight.intensity = target.value;
        };

        const handlePanelToggle = () => {
            if (panel.classList.contains("options-menu-visible")) {
                panel.classList.remove("options-menu-visible");
            } else {
                panel.classList.add("options-menu-visible");
            }
        };

        const panel = BUI.Component.create(() => {
            return BUI.html`
                <bim-panel label="Worlds Tutorial" class="options-menu">
                    <bim-panel-section label="Controls">
                        <bim-color-input
                            label="Background Color" color="#202932"
                            @input="${handleBackgroundColorChange}">
                        </bim-color-input>

                        <bim-number-input
                            slider step="0.1" label="Directional lights intensity" value="1.5" min="0.1" max="10"
                            @change="${handleDirectionalLightChange}">
                        </bim-number-input>

                        <bim-number-input
                            slider step="0.1" label="Ambient light intensity" value="1" min="0.1" max="5"
                            @change="${handleAmbientLightChange}">
                        </bim-number-input>
                    </bim-panel-section>
                </bim-panel>
            `;
        });

        if (panelRef.current) {
            panelRef.current.appendChild(panel);
        }

        const button = BUI.Component.create(() => {
            return BUI.html`
                <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
                    @click="${handlePanelToggle}">
                </bim-button>
            `;
        });

        if (buttonRef.current) {
            buttonRef.current.appendChild(button);
        }

        return () => {
            components.dispose();
            if (panelRef.current) {
                panelRef.current.innerHTML = '';
            }
            if (buttonRef.current) {
                buttonRef.current.innerHTML = '';
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
                ref={buttonRef}
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
