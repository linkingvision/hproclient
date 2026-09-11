import { GamepadButtonState,GamepadAxisState } from './index'
interface XboxGamepadOptions {
    onButtonPress?: (data: GamepadButtonState, name: string) => void;
    onButtonRelease?: (data: GamepadButtonState, name: string) => void;
    onAxisChange?: (axes: Record<string, GamepadAxisState>) => void;
    onConnected?: (connected: boolean) => void;
    deadZone?: number;
}

export class XboxGamepad {
    private onButtonPress: (data: GamepadButtonState, name: string) => void;
    private onButtonRelease: (data: GamepadButtonState, name: string) => void;
    private onAxisChange: (axes: Record<string, GamepadAxisState>) => void;
    private onConnected: (connected: boolean) => void;
    private deadZone: number;

    public connected: boolean = false;
    private gamepadIndex: number | null = null;
    private buttons: Record<string, GamepadButtonState>;
    private axes: Record<string, GamepadAxisState>;
    private previousButtons: Record<string, GamepadButtonState>;
    private previousAxes: Record<string, GamepadAxisState>;
    private animationFrameId: number | null = null;

    // Xbox button mapping
    static readonly XBOX_BUTTONS_MAP: Record<number, string> = {
        0: 'A',
        1: 'B',
        2: 'X',
        3: 'Y',
        4: 'LB',
        5: 'RB',
        6: 'LT',
        7: 'RT',
        // 8: 'View',
        // 9: 'Menu',
        // 10: 'LeftStick',
        // 11: 'RightStick',
        // 12: 'DpadUp',
        // 13: 'DpadDown',
        // 14: 'DpadLeft',
        // 15: 'DpadRight'
    };

    // Xbox controller axis mapping
    static readonly XBOX_AXES_MAP: Record<number, string> = {
        0: 'LeftStickX',
        1: 'LeftStickY',
        // 2: 'RightStickX',
        // 3: 'RightStickY'
    };

    constructor(options: XboxGamepadOptions = {}) {
        const {
            onButtonPress = () => {},
            onButtonRelease = () => {},
            onAxisChange = () => {},
            onConnected = () => {},
            deadZone = 0.05
        } = options;

        this.onButtonPress = onButtonPress;
        this.onButtonRelease = onButtonRelease;
        this.onAxisChange = onAxisChange;
        this.onConnected = onConnected;
        this.deadZone = deadZone;

        this.buttons = this.initButtons();
        this.axes = this.initAxes();
        this.previousButtons = this.initButtons();
        this.previousAxes = this.initAxes();
    }

    // initialize button status object
    private initButtons(): Record<string, GamepadButtonState> {
        const btns: Record<string, GamepadButtonState> = {};
        Object.entries(XboxGamepad.XBOX_BUTTONS_MAP).forEach(([key, name]) => {
            const index = parseInt(key);
            btns[name] = {
                pressed: false,
                value: 0,
                index
            };
        });
        return btns;
    }

    // initialize joystick status object
    private initAxes(): Record<string, GamepadAxisState> {
        const axs: Record<string, GamepadAxisState> = {};
        Object.entries(XboxGamepad.XBOX_AXES_MAP).forEach(([key, name]) => {
            const index = parseInt(key);
            axs[name] = {
                value: 0,
                index
            };
        });
        return axs;
    }

    // check Xbox status
    private checkGamepad(): void {
        const gamepads = navigator.getGamepads();
        const gamepad = this.gamepadIndex !== null
            ? gamepads[this.gamepadIndex]
            : this.findFirstConnectedGamepad(gamepads);

        if (!gamepad) {
            this.connected = false;
            this.onConnected(false);
            this.gamepadIndex = null;
            this.animationFrameId = requestAnimationFrame(() => this.checkGamepad());
            return;
        }

        this.connected = true;
        this.onConnected(true);
        this.gamepadIndex = gamepad.index;

        // update button status
        this.updateButtonsState(gamepad);

        // update joystick status
        this.updateAxesState(gamepad);

        // save current state for next comparison
        this.previousButtons = JSON.parse(JSON.stringify(this.buttons));

        this.animationFrameId = requestAnimationFrame(() => this.checkGamepad());
    }

    // find the first connected controller
    private findFirstConnectedGamepad(gamepads: (Gamepad | null)[]): Gamepad | null {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                return gamepads[i];
            }
        }
        return null;
    }

    // update button status
    private updateButtonsState(gamepad: Gamepad): void {
        Object.entries(XboxGamepad.XBOX_BUTTONS_MAP).forEach(([key, name]) => {
            const index = parseInt(key);
            const button = gamepad.buttons[index];

            if (button) {
                const data: GamepadButtonState = {
                    pressed: button.pressed,
                    value: button.value,
                    index
                };
                this.buttons[name] = data;
                // Button press event
                if (button.pressed && !this.previousButtons[name].pressed) {
                    this.onButtonPress(data, name);
                }
                // Button release event
                if (!button.pressed && this.previousButtons[name].pressed) {
                    this.onButtonRelease(data, name);
                }
            }
        });
    }

    // update joystick status
    private updateAxesState(gamepad: Gamepad): void {
        let axesStatus = false;
        Object.entries(XboxGamepad.XBOX_AXES_MAP).forEach(([key, name]) => {
            const index = parseInt(key);
            const rawValue = gamepad.axes[index];
            const axisValue = Math.abs(rawValue) > this.deadZone ? rawValue : 0;

            this.axes[name] = {
                value: axisValue,
                index
            };
            // Detect joystick changes
            //Math.ceil(axisValue * 10) / 10
            if (Math.abs(Math.ceil(axisValue * 10) / 10 - Math.ceil(this.previousAxes[name].value * 10) / 10) >= 0.1) {
                axesStatus = true;
            }
        });

        if (axesStatus) {
            this.onAxisChange(JSON.parse(JSON.stringify(this.axes)));
            this.previousAxes = JSON.parse(JSON.stringify(this.axes));
        }
    }

    // controller connection event
    private onGamepadConnected(event: GamepadEvent): void {
        console.log('Gamepad connected:', event.gamepad);
        this.gamepadIndex = event.gamepad.index;
        this.onConnected(true);
        this.checkGamepad();
    }

    // controller disconnection event
    private onGamepadDisconnected(event: GamepadEvent): void {
        console.log('Gamepad disconnected:', event.gamepad);
        if (this.gamepadIndex === event.gamepad.index) {
            this.connected = false;
            this.onConnected(false);
            this.gamepadIndex = null;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    // start listening to controller events
    public startListening(): void {
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e as GamepadEvent));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e as GamepadEvent));

        // start detection if the controller is connected
        const gamepads = navigator.getGamepads();
        const gamepad = this.findFirstConnectedGamepad(gamepads);
        if (gamepad) {
            this.onGamepadConnected(new GamepadEvent('gamepadconnected', { gamepad }));
        }
    }

    // stop listening to controller events
    public stopListening(): void {
        window.removeEventListener('gamepadconnected', (e) => this.onGamepadConnected(e as GamepadEvent));
        window.removeEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e as GamepadEvent));
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}