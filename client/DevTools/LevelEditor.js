import { styled, theme, Elem, Button, Component } from 'vanilla-bean-components';

import { minerals } from '../../constants/minerals';

const getMineralLabel = (colorKey, mineral) => {
	const colorName = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
	return `${mineral.name} (${colorName})`;
};

const ColorSwatch = styled.Elem`
	display: block;
	min-width: 20px;
	min-height: 20px;
	border-radius: 3px;
	border: 1px solid ${theme.colors.gray};
	flex-shrink: 0;
`;

const Panel = styled.Elem`
	background: rgba(0, 0, 0, 0.3);
	border: 3px solid ${theme.colors.lighter(theme.colors.blue)};
	border-radius: 8px;
	padding: 20px;
`;

const Section = styled.Elem`
	background: rgba(0, 0, 0, 0.2);
	border: 2px solid ${({ borderColor }) => borderColor || theme.colors.lighter(theme.colors.blue)};
	border-radius: 8px;
	padding: 15px;
	margin-bottom: 15px;
`;

const SectionHeader = styled.Elem`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
`;

const SectionTitle = styled.Elem`
	color: ${({ titleColor }) => titleColor || theme.colors.lighter(theme.colors.blue)};
	font-size: 13px;
	font-weight: bold;
`;

const ControlRow = styled.Elem`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
	gap: 10px;
`;

const ControlLabel = styled.Elem`
	color: ${theme.colors.lighter(theme.colors.gray)};
	font-size: 12px;
	min-width: 100px;
`;

const ButtonGroup = styled.Elem`
	display: flex;
	gap: 8px;
`;

const StatsRow = styled.Elem`
	display: flex;
	justify-content: space-between;
	padding: 3px 0;
	border-bottom: 1px solid ${theme.colors.darker(theme.colors.gray)};
`;

const LegendItem = styled.Elem`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const VeinBox = styled.Elem`
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid ${theme.colors.gray};
	border-radius: 6px;
	padding: 10px;
	margin-bottom: 10px;
`;

const CheckboxRow = styled.Elem`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 5px;
`;

const selectStyles = {
	background: theme.colors.black,
	color: theme.colors.white,
	border: `2px solid ${theme.colors.lighter(theme.colors.blue)}`,
	padding: '8px 15px',
	borderRadius: '6px',
	fontSize: '14px',
};

const inputStyles = {
	background: theme.colors.black,
	color: theme.colors.white,
	border: `1px solid ${theme.colors.gray}`,
	padding: '4px 8px',
	borderRadius: '4px',
	fontSize: '12px',
};

const defaultOptions = {
	tag: 'div',
};

/**
 * Asteroid Level Editor Component - Full Feature Parity
 * Complete rebuild with working reactivity and all configuration controls
 */
export class LevelEditor extends Component {
	defaultOptions = { ...super.defaultOptions, ...defaultOptions };

	constructor(options = {}) {
		super({ ...defaultOptions, ...options });

		// Simple state object - no Context reactivity issues
		this.state = {
			worlds: [],
			selectedWorld: null,
			worldConfig: null,
			asteroid: null,
			generating: false,
			saving: false,
			overlays: {
				white: true,
				orange: true,
				yellow: true,
				green: true,
				teal: true,
				blue: true,
				purple: true,
				pink: true,
				red: true,
				black: true,
				lava: true,
				gas: true,
				psykickEggs: true,
				mineralItems: true,
				otherItems: true,
				aliens: true,
			},
		};

		// Load worlds on initialization
		this.loadWorlds();
	}

	async loadWorlds() {
		try {
			const response = await fetch('/api/dev/worlds');
			const worlds = await response.json();
			this.state.worlds = worlds;
			if (worlds.length > 0) {
				this.state.selectedWorld = worlds[0].id;
				this.state.worldConfig = JSON.parse(JSON.stringify(worlds[0]));
			}
			this.refresh();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to load worlds:', error);
		}
	}

	// Manual refresh method - solves reactivity issues
	refresh() {
		this.elem.innerHTML = '';
		this.renderContent();
	}

	renderContent() {
		const { worldConfig } = this.state;

		// Main container with console styling
		const MainContainer = styled.Elem`
			display: flex;
			flex-direction: column;
			gap: 20px;
			max-width: 1800px;
			margin: 0 auto;
			font-family: 'FontWithASyntaxHighlighter', monospace;
		`;

		const container = new MainContainer({ appendTo: this });

		// Header section
		this.renderHeader(container);

		if (!worldConfig) {
			new Elem({
				appendTo: container,
				textContent: '> Loading configuration...',
				styles: {
					color: theme.colors.lighter(theme.colors.gray),
					padding: '40px',
					textAlign: 'center',
				},
			});
			return;
		}

		// Main grid layout
		const MainGrid = styled.Elem`
			display: grid;
			grid-template-columns: 1fr 600px;
			gap: 20px;

			@media (max-width: 1400px) {
				grid-template-columns: 1fr;
			}
		`;

		const mainGrid = new MainGrid({ appendTo: container });

		// Left: Configuration controls
		this.renderControls(mainGrid);

		// Right: Preview and stats
		this.renderPreview(mainGrid);
	}

	renderHeader(container) {
		const { worlds, selectedWorld, generating, saving } = this.state;

		const Header = styled.Elem`
			background: rgba(0, 0, 0, 0.4);
			border: 3px solid ${theme.colors.lighter(theme.colors.blue)};
			border-radius: 8px;
			padding: 20px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
			gap: 15px;
		`;

		const header = new Header({ appendTo: container });

		new Elem({
			appendTo: header,
			tag: 'h2',
			textContent: '> ASTEROID LEVEL EDITOR',
			styles: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '20px',
				margin: 0,
			},
		});

		const HeaderControls = styled.Elem`
			display: flex;
			gap: 15px;
			align-items: center;
			flex-wrap: wrap;
		`;

		const controls = new HeaderControls({ appendTo: header });

		// World selector
		new Elem({
			appendTo: controls,
			textContent: 'World:',
			styles: {
				color: theme.colors.lighter(theme.colors.gray),
				fontSize: '14px',
			},
		});

		const select = new Elem({
			appendTo: controls,
			tag: 'select',
			styles: {
				...selectStyles,
				minWidth: '250px',
			},
		});

		worlds.forEach(world => {
			const option = new Elem({
				appendTo: select,
				tag: 'option',
				attributes: { value: world.id },
				textContent: world.name || world.id,
			});
			if (world.id === selectedWorld) {
				option.elem.selected = true;
			}
		});

		select.elem.addEventListener('change', () => {
			const world = worlds.find(w => w.id === select.elem.value);
			console.log('World changed to:', world.id);
			console.log('World veins:', world.ground?.veins);
			console.log('World aliens:', world.aliens);
			this.state.selectedWorld = world.id;
			this.state.worldConfig = JSON.parse(JSON.stringify(world));
			this.state.asteroid = null;
			console.log('Calling refresh and generate after world change...');
			this.refresh();
			this.handleGenerate();
		});

		// Generate button
		new Button({
			appendTo: controls,
			content: generating ? '> Generating...' : '> Generate',
			disabled: generating,
			onPointerPress: () => this.handleGenerate(),
		});

		if (this.state.asteroid) {
			// Copy to clipboard button
			new Button({
				appendTo: controls,
				content: '> Copy JSON',
				onPointerPress: () => this.handleCopyToClipboard(),
			});

			// Save button
			new Button({
				appendTo: controls,
				content: saving ? '> Saving...' : '> Save to Game',
				disabled: saving,
				onPointerPress: () => this.handleSave(),
			});
		}
	}

	renderControls(parent) {
		const { worldConfig } = this.state;

		const ControlsPanel = styled(Panel)`
			max-height: 800px;
			overflow-y: auto;

			&::-webkit-scrollbar {
				width: 10px;
			}

			&::-webkit-scrollbar-track {
				background: rgba(0, 0, 0, 0.3);
			}

			&::-webkit-scrollbar-thumb {
				background: ${theme.colors.blue};
				border-radius: 5px;
			}
		`;

		const controlsPanel = new ControlsPanel({ appendTo: parent });

		new Elem({
			appendTo: controlsPanel,
			tag: 'h3',
			textContent: '> Configuration Controls',
			styles: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '16px',
				marginBottom: '20px',
			},
		});

		// Basic properties
		this.renderSection(controlsPanel, {
			title: '// BASIC PROPERTIES',
			color: 'blue',
			onClear: () => {
				worldConfig.size = 'medium';
				worldConfig.shape = 'balanced';
				this.refresh();
			},
			controls: [
				{
					label: 'Size',
					type: 'select',
					value: worldConfig.size || 'medium',
					options: [
						{ value: 'small', label: 'Small (30-40)' },
						{ value: 'medium', label: 'Medium (45-55)' },
						{ value: 'large', label: 'Large (65-75)' },
						{ value: 'huge', label: 'Huge (85-95)' },
					],
					onChange: value => {
						worldConfig.size = value;
					},
				},
				{
					label: 'Shape',
					type: 'select',
					value: worldConfig.shape || 'balanced',
					options: [
						{ value: 'wide', label: 'Wide' },
						{ value: 'tall', label: 'Tall' },
						{ value: 'deep', label: 'Deep' },
						{ value: 'square', label: 'Square' },
						{ value: 'balanced', label: 'Balanced' },
					],
					onChange: value => {
						worldConfig.shape = value;
					},
				},
			],
		});

		// Crater configuration
		this.renderSection(controlsPanel, {
			title: '// CRATER CONFIGURATION',
			color: 'orange',
			onClear: () => {
				worldConfig.craters = { huge: [0, 0], big: [0, 0], medium: [0, 0], small: [0, 0], tiny: [0, 0] };
				this.refresh();
			},
			onReset: () => {
				worldConfig.craters = { huge: [0, 1], big: [1, 2], medium: [3, 6], small: [8, 12], tiny: [5, 10] };
				this.refresh();
			},
			controls: [
				{
					label: 'Huge',
					type: 'range',
					min: worldConfig.craters?.huge?.[0] ?? 0,
					max: worldConfig.craters?.huge?.[1] ?? 1,
					onChange: (min, max) => {
						if (!worldConfig.craters) worldConfig.craters = {};
						worldConfig.craters.huge = [min, max];
					},
				},
				{
					label: 'Big',
					type: 'range',
					min: worldConfig.craters?.big?.[0] ?? 1,
					max: worldConfig.craters?.big?.[1] ?? 2,
					onChange: (min, max) => {
						if (!worldConfig.craters) worldConfig.craters = {};
						worldConfig.craters.big = [min, max];
					},
				},
				{
					label: 'Medium',
					type: 'range',
					min: worldConfig.craters?.medium?.[0] ?? 3,
					max: worldConfig.craters?.medium?.[1] ?? 6,
					onChange: (min, max) => {
						if (!worldConfig.craters) worldConfig.craters = {};
						worldConfig.craters.medium = [min, max];
					},
				},
				{
					label: 'Small',
					type: 'range',
					min: worldConfig.craters?.small?.[0] ?? 8,
					max: worldConfig.craters?.small?.[1] ?? 12,
					onChange: (min, max) => {
						if (!worldConfig.craters) worldConfig.craters = {};
						worldConfig.craters.small = [min, max];
					},
				},
				{
					label: 'Tiny',
					type: 'range',
					min: worldConfig.craters?.tiny?.[0] ?? 5,
					max: worldConfig.craters?.tiny?.[1] ?? 10,
					onChange: (min, max) => {
						if (!worldConfig.craters) worldConfig.craters = {};
						worldConfig.craters.tiny = [min, max];
					},
				},
			],
		});

		// Cave configuration
		this.renderSection(controlsPanel, {
			title: '// CAVE CONFIGURATION',
			color: 'purple',
			onClear: () => {
				worldConfig.caves = { huge: [0, 0], big: [0, 0], medium: [0, 0], small: [0, 0], tiny: [0, 0] };
				this.refresh();
			},
			onReset: () => {
				worldConfig.caves = { huge: [0, 1], big: [1, 2], medium: [2, 4], small: [4, 7], tiny: [3, 6] };
				this.refresh();
			},
			controls: [
				{
					label: 'Huge',
					type: 'range',
					min: worldConfig.caves?.huge?.[0] ?? 0,
					max: worldConfig.caves?.huge?.[1] ?? 1,
					onChange: (min, max) => {
						if (!worldConfig.caves) worldConfig.caves = {};
						worldConfig.caves.huge = [min, max];
					},
				},
				{
					label: 'Big',
					type: 'range',
					min: worldConfig.caves?.big?.[0] ?? 1,
					max: worldConfig.caves?.big?.[1] ?? 2,
					onChange: (min, max) => {
						if (!worldConfig.caves) worldConfig.caves = {};
						worldConfig.caves.big = [min, max];
					},
				},
				{
					label: 'Medium',
					type: 'range',
					min: worldConfig.caves?.medium?.[0] ?? 2,
					max: worldConfig.caves?.medium?.[1] ?? 4,
					onChange: (min, max) => {
						if (!worldConfig.caves) worldConfig.caves = {};
						worldConfig.caves.medium = [min, max];
					},
				},
				{
					label: 'Small',
					type: 'range',
					min: worldConfig.caves?.small?.[0] ?? 4,
					max: worldConfig.caves?.small?.[1] ?? 7,
					onChange: (min, max) => {
						if (!worldConfig.caves) worldConfig.caves = {};
						worldConfig.caves.small = [min, max];
					},
				},
				{
					label: 'Tiny',
					type: 'range',
					min: worldConfig.caves?.tiny?.[0] ?? 3,
					max: worldConfig.caves?.tiny?.[1] ?? 6,
					onChange: (min, max) => {
						if (!worldConfig.caves) worldConfig.caves = {};
						worldConfig.caves.tiny = [min, max];
					},
				},
			],
		});

		// Tunnel configuration
		this.renderSection(controlsPanel, {
			title: '// TUNNEL SYSTEM',
			color: 'teal',
			onClear: () => {
				worldConfig.tunnels = { count: [0, 0], branchProbability: 0, maxBranches: 0, segmentLength: [1, 1], wanderStrength: 0 };
				this.refresh();
			},
			onReset: () => {
				worldConfig.tunnels = { count: [2, 4], branchProbability: 0.3, maxBranches: 3, segmentLength: [4, 8], wanderStrength: 0.4 };
				this.refresh();
			},
			controls: [
				{
					label: 'Count',
					type: 'range',
					min: worldConfig.tunnels?.count?.[0] ?? 2,
					max: worldConfig.tunnels?.count?.[1] ?? 4,
					onChange: (min, max) => {
						if (!worldConfig.tunnels) worldConfig.tunnels = {};
						worldConfig.tunnels.count = [min, max];
					},
				},
				{
					label: 'Branch Prob.',
					type: 'number',
					value: worldConfig.tunnels?.branchProbability ?? 0.3,
					step: 0.1,
					onChange: value => {
						if (!worldConfig.tunnels) worldConfig.tunnels = {};
						worldConfig.tunnels.branchProbability = parseFloat(value);
					},
				},
				{
					label: 'Max Branches',
					type: 'number',
					value: worldConfig.tunnels?.maxBranches ?? 3,
					onChange: value => {
						if (!worldConfig.tunnels) worldConfig.tunnels = {};
						worldConfig.tunnels.maxBranches = parseInt(value);
					},
				},
				{
					label: 'Segment Length',
					type: 'range',
					min: worldConfig.tunnels?.segmentLength?.[0] ?? 4,
					max: worldConfig.tunnels?.segmentLength?.[1] ?? 8,
					onChange: (min, max) => {
						if (!worldConfig.tunnels) worldConfig.tunnels = {};
						worldConfig.tunnels.segmentLength = [min, max];
					},
				},
				{
					label: 'Wander',
					type: 'number',
					value: worldConfig.tunnels?.wanderStrength ?? 0.4,
					step: 0.1,
					onChange: value => {
						if (!worldConfig.tunnels) worldConfig.tunnels = {};
						worldConfig.tunnels.wanderStrength = parseFloat(value);
					},
				},
			],
		});

		// Mineral veins
		this.renderVeinControls(controlsPanel);

		// Environmental hazards
		this.renderSection(controlsPanel, {
			title: '// ENVIRONMENTAL HAZARDS',
			color: 'red',
			onClear: () => {
				worldConfig.hazards = { lavaPool: [0, 0], gasPocket: [0, 0], lavaBubble: [0, 0], gasBubble: [0, 0] };
				this.refresh();
			},
			onReset: () => {
				worldConfig.hazards = { lavaPool: [2, 3], gasPocket: [1, 2], lavaBubble: [0, 0], gasBubble: [0, 0] };
				this.refresh();
			},
			controls: [
				{
					label: 'Lava Pools',
					type: 'range',
					min: worldConfig.hazards?.lavaPool?.[0] ?? 2,
					max: worldConfig.hazards?.lavaPool?.[1] ?? 3,
					onChange: (min, max) => {
						if (!worldConfig.hazards) worldConfig.hazards = {};
						worldConfig.hazards.lavaPool = [min, max];
					},
				},
				{
					label: 'Gas Pockets',
					type: 'range',
					min: worldConfig.hazards?.gasPocket?.[0] ?? 1,
					max: worldConfig.hazards?.gasPocket?.[1] ?? 2,
					onChange: (min, max) => {
						if (!worldConfig.hazards) worldConfig.hazards = {};
						worldConfig.hazards.gasPocket = [min, max];
					},
				},
				{
					label: 'Lava Bubbles',
					type: 'range',
					min: worldConfig.hazards?.lavaBubble?.[0] ?? 0,
					max: worldConfig.hazards?.lavaBubble?.[1] ?? 0,
					onChange: (min, max) => {
						if (!worldConfig.hazards) worldConfig.hazards = {};
						worldConfig.hazards.lavaBubble = [min, max];
					},
				},
				{
					label: 'Gas Bubbles',
					type: 'range',
					min: worldConfig.hazards?.gasBubble?.[0] ?? 0,
					max: worldConfig.hazards?.gasBubble?.[1] ?? 0,
					onChange: (min, max) => {
						if (!worldConfig.hazards) worldConfig.hazards = {};
						worldConfig.hazards.gasBubble = [min, max];
					},
				},
			],
		});

		// Aliens and items
		this.renderSection(controlsPanel, {
			title: '// ALIENS & ITEMS',
			color: 'green',
			onClear: () => {
				worldConfig.alienBudget = [0, 0];
				worldConfig.itemBudget = [0, 0];
				worldConfig.alienTypes = [];
				worldConfig.items.types = [];
				this.refresh();
			},
			onReset: () => {
				worldConfig.alienBudget = [2, 6];
				worldConfig.itemBudget = [4, 8];
				worldConfig.alienTypes = [];
				worldConfig.items.types = [];
				this.refresh();
			},
			controls: [
				{
					label: 'Alien Budget',
					type: 'range',
					min: worldConfig.alienBudget?.[0] ?? 2,
					max: worldConfig.alienBudget?.[1] ?? 6,
					onChange: (min, max) => {
						worldConfig.alienBudget = [min, max];
					},
				},
				{
					label: 'Item Budget',
					type: 'range',
					min: worldConfig.itemBudget?.[0] ?? 4,
					max: worldConfig.itemBudget?.[1] ?? 8,
					onChange: (min, max) => {
						worldConfig.itemBudget = [min, max];
					},
				},
			],
		});

		// Alien Types configuration
		this.renderAlienTypesSection(controlsPanel);

		// Item Types configuration
		this.renderItemTypesSection(controlsPanel);
	}

	renderAlienTypesSection(parent) {
		const { worldConfig } = this.state;

		// Guard: ensure aliens.types exists
		if (!worldConfig.aliens) worldConfig.aliens = {};
		if (!worldConfig.aliens.types) worldConfig.aliens.types = {};

		const section = new Section({
			appendTo: parent,
			borderColor: theme.colors.lighter(theme.colors.green),
		});

		const header = new SectionHeader({ appendTo: section });

		new SectionTitle({
			appendTo: header,
			textContent: '// ALIEN TYPES',
			titleColor: theme.colors.lighter(theme.colors.green),
		});

		const availableAlienTypes = [
			'psykick_scout',
			'psykick_warrior',
			'rock_mite',
			'tunnel_chomper',
			'lava_spitter',
			'void_drifter',
			'depth_guardian',
			'hive_drone',
			'hive_soldier',
			'gas_sporecyst',
			'mimic_ore',
			'spawn_mother',
			'gift_bearer',
			'earth_mover',
			'resource_seeker',
		];

		// Mode indicator
		const isArray = Array.isArray(worldConfig.aliens.types);
		new Elem({
			appendTo: section,
			textContent: `Mode: ${isArray ? 'Array (list of types)' : 'Weighted (type: weight pairs)'}`,
			styles: {
				color: theme.colors.gray,
				fontSize: '11px',
				marginBottom: '10px',
			},
		});

		// Switch mode button
		new Button({
			appendTo: section,
			content: 'Switch Mode',
			style: { fontSize: '0.9em', padding: '4px 8px', marginBottom: '10px' },
			onPointerPress: () => {
				if (Array.isArray(worldConfig.aliens.types)) {
					// Convert to weighted object
					worldConfig.aliens.types = {};
				} else {
					// Convert to array
					worldConfig.aliens.types = [];
				}
				this.refresh();
			},
		});

		if (isArray) {
			// Array mode - checkboxes
			availableAlienTypes.forEach(type => {
				const row = new CheckboxRow({ appendTo: section });

				const checkbox = new Elem({
					appendTo: row,
					tag: 'input',
					attributes: {
						type: 'checkbox',
					},
					styles: {
						accentColor: theme.colors.lighter(theme.colors.green),
					},
				});

				// Set checked property directly on DOM element (not as attribute)
				checkbox.elem.checked = worldConfig.aliens.types.includes(type);

				new Elem({
					appendTo: row,
					textContent: type.replace(/_/g, ' '),
					styles: {
						color: theme.colors.white,
						fontSize: '12px',
						textTransform: 'capitalize',
					},
				});

				checkbox.elem.addEventListener('change', () => {
					if (checkbox.elem.checked) {
						if (!worldConfig.aliens.types.includes(type)) {
							worldConfig.aliens.types.push(type);
						}
					} else {
						const index = worldConfig.aliens.types.indexOf(type);
						if (index > -1) {
							worldConfig.aliens.types.splice(index, 1);
						}
					}
				});
			});
		} else {
			// Weighted mode - inputs
			availableAlienTypes.forEach(type => {
				this.renderControl(section, {
					label: type.replace(/_/g, ' '),
					type: 'number',
					value: worldConfig.aliens.types[type] ?? 0,
					step: 0.1,
					min: 0,
					onChange: value => {
						const numValue = parseFloat(value);
						if (numValue > 0) {
							worldConfig.aliens.types[type] = numValue;
						} else {
							delete worldConfig.aliens.types[type];
						}
					},
				});
			});
		}
	}

	renderItemTypesSection(parent) {
		const { worldConfig } = this.state;

		// Guard: ensure items.types exists
		if (!worldConfig.items) worldConfig.items = {};
		if (!worldConfig.items.types) worldConfig.items.types = {};

		console.log('renderItemTypesSection - items.types:', worldConfig.items.types);
		console.log('Is array?', Array.isArray(worldConfig.items.types));

		const section = new Section({
			appendTo: parent,
			borderColor: theme.colors.lighter(theme.colors.green),
		});

		const header = new SectionHeader({ appendTo: section });

		new SectionTitle({
			appendTo: header,
			textContent: '// ITEM TYPES',
			titleColor: theme.colors.lighter(theme.colors.green),
		});

		const availableItemTypes = [
			'oil',
			'battery',
			'spaceco_teleporter',
			'repair_nanites',
			'timed_charge',
			'advanced_teleporter',
			'remote_charge',
			'detonator',
			'transport_insurance',
		];

		// Mode indicator
		const isArray = Array.isArray(worldConfig.items.types);
		new Elem({
			appendTo: section,
			textContent: `Mode: ${isArray ? 'Array (list of types)' : 'Weighted (type: weight pairs)'}`,
			styles: {
				color: theme.colors.gray,
				fontSize: '11px',
				marginBottom: '10px',
			},
		});

		// Switch mode button
		new Button({
			appendTo: section,
			content: 'Switch Mode',
			style: { fontSize: '0.9em', padding: '4px 8px', marginBottom: '10px' },
			onPointerPress: () => {
				if (Array.isArray(worldConfig.items.types)) {
					// Convert to weighted object
					worldConfig.items.types = {};
				} else {
					// Convert to array
					worldConfig.items.types = [];
				}
				this.refresh();
			},
		});

		if (isArray) {
			// Array mode - checkboxes
			availableItemTypes.forEach(type => {
				const row = new CheckboxRow({ appendTo: section });

				const checkbox = new Elem({
					appendTo: row,
					tag: 'input',
					attributes: {
						type: 'checkbox',
					},
					styles: {
						accentColor: theme.colors.lighter(theme.colors.green),
					},
				});

				// Set checked property directly on DOM element (not as attribute)
				checkbox.elem.checked = worldConfig.items.types.includes(type);

				new Elem({
					appendTo: row,
					textContent: type.replace(/_/g, ' '),
					styles: {
						color: theme.colors.white,
						fontSize: '12px',
						textTransform: 'capitalize',
					},
				});

				checkbox.elem.addEventListener('change', () => {
					if (checkbox.elem.checked) {
						if (!worldConfig.items.types.includes(type)) {
							worldConfig.items.types.push(type);
						}
					} else {
						const index = worldConfig.items.types.indexOf(type);
						if (index > -1) {
							worldConfig.items.types.splice(index, 1);
						}
					}
				});
			});
		} else {
			// Weighted mode - inputs
			availableItemTypes.forEach(type => {
				this.renderControl(section, {
					label: type.replace(/_/g, ' '),
					type: 'number',
					value: worldConfig.items.types[type] ?? 0,
					step: 0.1,
					min: 0,
					onChange: value => {
						if (!worldConfig.items.types) worldConfig.items.types = {};
						const numValue = parseFloat(value);
						if (numValue > 0) {
							worldConfig.items.types[type] = numValue;
						} else {
							delete worldConfig.items.types[type];
						}
					},
				});
			});
		}
	}

	renderVeinControls(parent) {
		const { worldConfig } = this.state;

		const section = new Section({
			appendTo: parent,
			borderColor: theme.colors.lighter(theme.colors.purple),
		});

		const header = new SectionHeader({ appendTo: section });

		new SectionTitle({
			appendTo: header,
			textContent: '// MINERAL VEINS',
			titleColor: theme.colors.lighter(theme.colors.purple),
		});

		const buttons = new ButtonGroup({ appendTo: header });

		new Button({
			appendTo: buttons,
			content: 'Clear',
			style: { fontSize: '0.9em', padding: '4px 8px' },
			onPointerPress: () => {
				if (!worldConfig.ground) worldConfig.ground = {};
				worldConfig.ground.veins = [];
				this.refresh();
			},
		});

		new Button({
			appendTo: buttons,
			content: 'Reset',
			style: { fontSize: '0.9em', padding: '4px 8px' },
			onPointerPress: () => {
				if (!worldConfig.ground) worldConfig.ground = {};
				// Reset to default vein configuration
				worldConfig.ground.veins = [
					{
						color: 'orange',
						density: 2.0,
						size: 1.0,
						yield: 1.5,
						pattern: 'organic',
					},
				];
				this.refresh();
			},
		});

		new Button({
			appendTo: buttons,
			content: 'Add Vein',
			style: { fontSize: '0.9em', padding: '4px 8px' },
			onPointerPress: () => {
				if (!worldConfig.ground) worldConfig.ground = {};
				if (!worldConfig.ground.veins) worldConfig.ground.veins = [];
				worldConfig.ground.veins.push({
					color: 'orange',
					density: 2.0,
					size: 1.0,
					yield: 1.5,
					pattern: 'organic',
				});
				this.refresh();
			},
		});

		// Base color with swatch
		const baseColorRow = new ControlRow({ appendTo: section });

		new ControlLabel({
			appendTo: baseColorRow,
			textContent: 'Base Color:',
		});

		const InputContainer = styled.Elem`
			display: flex;
			align-items: center;
			gap: 8px;
			flex: 1;
		`;

		const baseColorInputContainer = new InputContainer({ appendTo: baseColorRow });

		const baseColorValue = worldConfig.ground?.base || 'white';
		const baseColorSwatch = new ColorSwatch({
			appendTo: baseColorInputContainer,
			textContent: ' ',
			style: {
				width: '20px',
				height: '20px',
				backgroundColor: minerals[baseColorValue]?.tint || '#fff',
			},
		});

		const baseColorSelect = new Elem({
			appendTo: baseColorInputContainer,
			tag: 'select',
			styles: {
				...inputStyles,
				flex: 1,
			},
		});

		Object.entries(minerals).forEach(([key, mineral]) => {
			const option = new Elem({
				appendTo: baseColorSelect,
				tag: 'option',
				attributes: { value: key },
				textContent: getMineralLabel(key, mineral),
			});
			if (key === baseColorValue) {
				option.elem.selected = true;
			}
		});

		baseColorSelect.elem.addEventListener('change', () => {
			if (!worldConfig.ground) worldConfig.ground = {};
			worldConfig.ground.base = baseColorSelect.elem.value;
			baseColorSwatch.elem.style.backgroundColor = minerals[baseColorSelect.elem.value]?.tint || '#fff';
		});

		// Veins list
		if (worldConfig.ground.veins && worldConfig.ground.veins.length > 0) {
			new Elem({
				appendTo: section,
				textContent: 'Veins:',
				styles: {
					color: theme.colors.lighter(theme.colors.gray),
					fontSize: '12px',
					marginTop: '15px',
					marginBottom: '8px',
				},
			});

			worldConfig.ground.veins.forEach((vein, index) => {
				const veinBox = new VeinBox({ appendTo: section });

				const veinHeader = new SectionHeader({
					appendTo: veinBox,
					style: { marginBottom: '8px' }
				});

				new Elem({
					appendTo: veinHeader,
					textContent: `Vein ${index + 1}`,
					styles: {
						color: theme.colors.white,
						fontSize: '12px',
						fontWeight: 'bold',
					},
				});

				new Button({
					appendTo: veinHeader,
					content: 'Remove',
					style: { fontSize: '0.9em', padding: '4px 8px' },
					onPointerPress: () => {
						worldConfig.ground.veins.splice(index, 1);
						this.refresh();
					},
				});

				// Custom color control with swatch
				const colorRow = new ControlRow({ appendTo: veinBox });

				new ControlLabel({
					appendTo: colorRow,
					textContent: 'Color:',
				});

				const colorInputContainer = new InputContainer({ appendTo: colorRow });

				const colorSwatch = new ColorSwatch({
					appendTo: colorInputContainer,
					textContent: ' ',
					style: {
						width: '20px',
						height: '20px',
						backgroundColor: minerals[vein.color]?.tint || '#fff',
					},
				});

				const colorSelect = new Elem({
					appendTo: colorInputContainer,
					tag: 'select',
					styles: {
						...inputStyles,
						flex: 1,
					},
				});

				Object.entries(minerals).forEach(([key, mineral]) => {
					const option = new Elem({
						appendTo: colorSelect,
						tag: 'option',
						attributes: { value: key },
						textContent: getMineralLabel(key, mineral),
					});
					if (key === vein.color) {
						option.elem.selected = true;
					}
				});

				colorSelect.elem.addEventListener('change', () => {
					vein.color = colorSelect.elem.value;
					colorSwatch.elem.style.backgroundColor = minerals[vein.color]?.tint || '#fff';
				});

				this.renderControl(veinBox, {
					label: 'Density',
					type: 'number',
					value: vein.density ?? 2.0,
					step: 0.1,
					min: 0.1,
					max: 50,
					onChange: value => {
						vein.density = parseFloat(value);
					},
				});

				this.renderControl(veinBox, {
					label: 'Size',
					type: 'number',
					value: vein.size ?? 1.0,
					step: 0.1,
					min: 0.1,
					max: 5,
					onChange: value => {
						vein.size = parseFloat(value);
					},
				});

				this.renderControl(veinBox, {
					label: 'Yield',
					type: 'number',
					value: vein.yield ?? 1.5,
					step: 0.1,
					onChange: value => {
						vein.yield = parseFloat(value);
					},
				});

				this.renderControl(veinBox, {
					label: 'Pattern',
					type: 'select',
					value: vein.pattern || 'organic',
					options: [
						{ value: 'organic', label: 'Organic (winding veins)' },
						{ value: 'fractal', label: 'Fractal (branching)' },
						{ value: 'layered', label: 'Layered (horizontal bands)' },
						{ value: 'radial', label: 'Radial (center outward)' },
						{ value: 'scattered', label: 'Scattered (small clusters)' },
						{ value: 'concentric', label: 'Concentric (rings)' },
						{ value: 'grid', label: 'Grid (crystalline)' },
						{ value: 'spiral', label: 'Spiral (curved arms)' },
						{ value: 'faults', label: 'Fault Lines (cracks)' },
						{ value: 'lightning', label: 'Lightning (jagged branches)' },
						{ value: 'cellular', label: 'Cellular (honeycomb)' },
						{ value: 'flow', label: 'Flow (curved streams)' },
						{ value: 'percolation', label: 'Percolation (seepage)' },
						{ value: 'maze', label: 'Maze (pathways)' },
						{ value: 'noise_bands', label: 'Noise Bands (wavy stripes)' },
					],
					onChange: value => {
						vein.pattern = value;
					},
				});
			});
		}
	}

	renderPreview(parent) {
		const { asteroid } = this.state;

		const PreviewPanel = styled(Panel)`
			display: flex;
			flex-direction: column;
			gap: 15px;
		`;

		const previewPanel = new PreviewPanel({ appendTo: parent });

		new Elem({
			appendTo: previewPanel,
			tag: 'h3',
			textContent: '> Preview & Statistics',
			styles: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '16px',
			},
		});

		if (!asteroid) {
			new Elem({
				appendTo: previewPanel,
				textContent: '> Click Generate to create asteroid',
				styles: {
					color: theme.colors.lighter(theme.colors.gray),
					textAlign: 'center',
					padding: '60px 20px',
					fontSize: '14px',
				},
			});
			return;
		}

		// Canvas
		const canvas = new Elem({
			appendTo: previewPanel,
			tag: 'canvas',
			attributes: {
				width: 550,
				height: 450,
			},
			styles: {
				border: `2px solid ${theme.colors.gray}`,
				borderRadius: '6px',
				display: 'block',
			},
		});

		this.drawAsteroid(canvas.elem);

		// Legend
		this.renderLegend(previewPanel, canvas);

		// Stats
		this.renderStats(previewPanel);
	}

	renderSection(parent, config) {
		const { title, color, onClear, onReset, controls } = config;

		const section = new Section({
			appendTo: parent,
			borderColor: theme.colors.lighter(theme.colors[color] || theme.colors.blue),
		});

		const header = new SectionHeader({ appendTo: section });

		new SectionTitle({
			appendTo: header,
			textContent: title,
			titleColor: theme.colors.lighter(theme.colors[color] || theme.colors.blue),
		});

		if (onClear || onReset) {
			const buttons = new ButtonGroup({ appendTo: header });

			if (onClear) {
				new Button({
					appendTo: buttons,
					content: 'Clear',
					style: { fontSize: '0.9em', padding: '4px 8px' },
					onPointerPress: onClear,
				});
			}

			if (onReset) {
				new Button({
					appendTo: buttons,
					content: 'Reset',
					style: { fontSize: '0.9em', padding: '4px 8px' },
					onPointerPress: onReset,
				});
			}
		}

		controls.forEach(control => this.renderControl(section, control));
	}

	renderControl(parent, config) {
		const { label, type, value, min, max, step, options, onChange } = config;

		const row = new ControlRow({ appendTo: parent });

		new ControlLabel({
			appendTo: row,
			textContent: label + ':',
		});

		if (type === 'select') {
			const select = new Elem({
				appendTo: row,
				tag: 'select',
				styles: {
					...inputStyles,
					flex: 1,
				},
			});

			options.forEach(opt => {
				const option = new Elem({
					appendTo: select,
					tag: 'option',
					attributes: { value: opt.value },
					textContent: opt.label,
				});
				if (opt.value === value) {
					option.elem.selected = true;
				}
			});

			select.elem.addEventListener('change', () => onChange(select.elem.value));
		} else if (type === 'range') {
			const RangeInputs = styled.Elem`
				display: flex;
				gap: 5px;
				align-items: center;
			`;

			const inputs = new RangeInputs({ appendTo: row });

			const rangeInputStyles = {
				...inputStyles,
				width: '50px',
				padding: '4px',
				fontSize: '11px',
				textAlign: 'center',
			};

			const minInput = new Elem({
				appendTo: inputs,
				tag: 'input',
				attributes: { type: 'number', value: min },
				styles: rangeInputStyles,
			});

			new Elem({
				appendTo: inputs,
				textContent: '-',
				styles: { color: theme.colors.gray },
			});

			const maxInput = new Elem({
				appendTo: inputs,
				tag: 'input',
				attributes: { type: 'number', value: max },
				styles: rangeInputStyles,
			});

			minInput.elem.addEventListener('change', () => {
				onChange(parseInt(minInput.elem.value), parseInt(maxInput.elem.value));
			});

			maxInput.elem.addEventListener('change', () => {
				onChange(parseInt(minInput.elem.value), parseInt(maxInput.elem.value));
			});
		} else if (type === 'number') {
			const attributes = { type: 'number', value: value, step: step || 1 };
			if (min !== undefined) attributes.min = min;
			if (max !== undefined) attributes.max = max;

			const input = new Elem({
				appendTo: row,
				tag: 'input',
				attributes,
				styles: {
					...inputStyles,
					width: '80px',
					textAlign: 'center',
				},
			});

			input.elem.addEventListener('change', () => onChange(input.elem.value));
		}
	}

	renderLegend(parent, canvas) {
		const Legend = styled.Elem`
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
			padding: 15px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid ${theme.colors.gray};
			border-radius: 6px;
		`;

		const legend = new Legend({ appendTo: parent });

		new Elem({
			appendTo: legend,
			textContent: '> Overlay Layers',
			styles: {
				gridColumn: '1 / -1',
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '12px',
				marginBottom: '5px',
			},
		});

		// Mineral overlays
		Object.entries(minerals).forEach(([key, mineral]) => {
			this.renderLegendItem(legend, {
				key,
				label: getMineralLabel(key, mineral),
				color: mineral.tint,
				canvas,
			});
		});

		// Hazard and entity overlays
		[
			{ key: 'psykickEggs', label: 'Psykick Eggs', color: '#FF00FF' },
			{ key: 'mineralItems', label: 'Mineral Items', color: '#000000' },
			{ key: 'otherItems', label: 'Other Items', color: '#00FFFF' },
			{ key: 'aliens', label: 'Aliens', color: '#FF0000' },
			{ key: 'lava', label: 'Lava', color: '#FF6600' },
			{ key: 'gas', label: 'Gas', color: '#FFFF00' },
		].forEach(({ key, label, color }) => {
			this.renderLegendItem(legend, { key, label, color, canvas });
		});
	}

	renderLegendItem(parent, config) {
		const { key, label, color, canvas } = config;
		const { overlays } = this.state;

		const item = new LegendItem({ appendTo: parent, tag: 'label' });

		const checkbox = new Elem({
			appendTo: item,
			tag: 'input',
			attributes: {
				type: 'checkbox',
			},
			styles: {
				accentColor: theme.colors.lighter(theme.colors.blue),
			},
		});

		// Set checked property directly on DOM element (not as attribute)
		checkbox.elem.checked = overlays[key];

		new ColorSwatch({
			appendTo: item,
			textContent: ' ',
			style: {
				width: '14px',
				height: '14px',
				backgroundColor: color,
			},
		});

		new Elem({
			appendTo: item,
			textContent: label,
			styles: {
				color: theme.colors.white,
				fontSize: '11px',
			},
		});

		checkbox.elem.addEventListener('change', () => {
			overlays[key] = checkbox.elem.checked;
			this.drawAsteroid(canvas.elem);
		});
	}

	renderStats(parent) {
		const { asteroid } = this.state;
		console.log('renderStats called, asteroid:', !!asteroid);

		if (!asteroid) {
			console.log('renderStats: no asteroid, exiting');
			return;
		}

		const StatsPanel = styled.Elem`
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid ${theme.colors.gray};
			border-radius: 6px;
			padding: 15px;
		`;

		const statsPanel = new StatsPanel({ appendTo: parent });

		new Elem({
			appendTo: statsPanel,
			textContent: '> Statistics',
			style: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '14px',
				fontWeight: 'bold',
				marginBottom: '15px',
				paddingBottom: '8px',
				borderBottom: `1px solid ${theme.colors.darker(theme.colors.gray)}`,
			},
		});

		const stats = this.calculateStats(asteroid);

		// Basic dimensions
		[
			{ label: 'Dimensions', value: `${asteroid.width} x ${asteroid.depth}` },
			{ label: 'Total Cells', value: asteroid.width * asteroid.depth },
			{ label: 'Ground Cells', value: stats.groundCells },
			{ label: 'Empty Space', value: stats.emptyCells },
			{ label: 'Coverage', value: `${stats.coveragePercent}%` },
		].forEach(({ label, value }) => {
			const row = new StatsRow({ appendTo: statsPanel });

			new Elem({
				appendTo: row,
				textContent: label + ':',
				style: {
					color: theme.colors.lighter(theme.colors.gray),
					fontSize: '11px',
				},
			});

			new Elem({
				appendTo: row,
				textContent: String(value),
				style: {
					color: theme.colors.white,
					fontSize: '11px',
					fontWeight: 'bold',
				},
			});
		});

		// Hazards section header
		new Elem({
			appendTo: statsPanel,
			textContent: '> Hazards',
			style: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '12px',
				fontWeight: 'bold',
				marginTop: '12px',
				marginBottom: '8px',
			},
		});

		[
			{ label: 'Lava Cells', value: stats.lavaCount },
			{ label: 'Gas Cells', value: stats.gasCount },
		].forEach(({ label, value }) => {
			const row = new StatsRow({ appendTo: statsPanel });

			new Elem({
				appendTo: row,
				textContent: label + ':',
				style: {
					color: theme.colors.lighter(theme.colors.gray),
					fontSize: '11px',
				},
			});

			new Elem({
				appendTo: row,
				textContent: String(value),
				style: {
					color: theme.colors.white,
					fontSize: '11px',
					fontWeight: 'bold',
				},
			});
		});

		// Entities section header
		new Elem({
			appendTo: statsPanel,
			textContent: '> Entities',
			style: {
				color: theme.colors.lighter(theme.colors.blue),
				fontSize: '12px',
				fontWeight: 'bold',
				marginTop: '12px',
				marginBottom: '8px',
			},
		});

		[
			{ label: 'Psykick Eggs', value: stats.psykickEggCount },
			{ label: 'Mineral Items', value: stats.mineralItemCount },
			{ label: 'Other Items', value: stats.otherItemCount },
			{ label: 'Aliens', value: stats.alienCount },
		].forEach(({ label, value }) => {
			const row = new StatsRow({ appendTo: statsPanel });

			new Elem({
				appendTo: row,
				textContent: label + ':',
				style: {
					color: theme.colors.lighter(theme.colors.gray),
					fontSize: '11px',
				},
			});

			new Elem({
				appendTo: row,
				textContent: String(value),
				style: {
					color: theme.colors.white,
					fontSize: '11px',
					fontWeight: 'bold',
				},
			});
		});

		// Mineral breakdown - Ground tiles
		if (Object.keys(stats.mineralBreakdown).length > 0) {
			const totalMinerals = Object.values(stats.mineralBreakdown).reduce((sum, count) => sum + count, 0);

			new Elem({
				appendTo: statsPanel,
				textContent: `> Ground Tiles: ${totalMinerals}`,
				style: {
					color: theme.colors.lighter(theme.colors.blue),
					fontSize: '12px',
					fontWeight: 'bold',
					marginTop: '12px',
					marginBottom: '8px',
				},
			});

			// Show ALL minerals with percentages, not just top 5
			Object.entries(stats.mineralBreakdown)
				.sort(([, a], [, b]) => b - a)
				.forEach(([mineralType, count]) => {
					const mineral = minerals[mineralType];
					if (!mineral) return;

					const percentage = Math.round((count / totalMinerals) * 100);

					const row = new StatsRow({ appendTo: statsPanel });

					const MineralInfo = styled.Elem`
						display: flex;
						align-items: center;
						gap: 6px;
					`;

					const left = new MineralInfo({ appendTo: row });

					new ColorSwatch({
						appendTo: left,
						textContent: ' ',
						style: {
							width: '10px',
							height: '10px',
							backgroundColor: mineral.tint,
							borderRadius: '2px',
						},
					});

					new Elem({
						appendTo: left,
						textContent: getMineralLabel(mineralType, mineral),
						style: {
							color: theme.colors.gray,
							fontSize: '11px',
						},
					});

					new Elem({
						appendTo: row,
						textContent: `${count} (${percentage}%)`,
						style: {
							color: theme.colors.white,
							fontSize: '11px',
							fontWeight: 'bold',
						},
					});
				});
		}

		// Pure Mineral Crystals breakdown
		const pureMineralItems = Object.entries(stats.itemBreakdown).filter(([type]) =>
			type.startsWith('pure_') || type.includes('mineral_pure_'),
		);
		if (pureMineralItems.length > 0) {
			const totalPureMinerals = pureMineralItems.reduce((sum, [, count]) => sum + count, 0);

			new Elem({
				appendTo: statsPanel,
				textContent: `> Pure Mineral Crystals: ${totalPureMinerals}`,
				style: {
					color: theme.colors.lighter(theme.colors.blue),
					fontSize: '12px',
					fontWeight: 'bold',
					marginTop: '12px',
					marginBottom: '8px',
				},
			});

			pureMineralItems.sort(([, a], [, b]) => b - a).forEach(([itemType, count]) => {
				// Extract mineral color from item type (e.g., "pure_white" or "mineral_pure_white")
				let mineralType = itemType;
				if (mineralType.includes('mineral_pure_')) {
					mineralType = mineralType.replace('mineral_pure_', '');
				} else if (mineralType.startsWith('pure_')) {
					mineralType = mineralType.replace('pure_', '');
				}

				const mineral = minerals[mineralType];

				if (!mineral) {
					console.warn('No mineral found for type:', itemType, '-> extracted:', mineralType);
					return;
				}

				const percentage = Math.round((count / totalPureMinerals) * 100);
				const row = new StatsRow({ appendTo: statsPanel });

				const MineralInfo = styled.Elem`
					display: flex;
					align-items: center;
					gap: 6px;
				`;

				const left = new MineralInfo({ appendTo: row });

				new ColorSwatch({
					appendTo: left,
					textContent: ' ',
					style: {
						width: '10px',
						height: '10px',
						backgroundColor: mineral.tint,
						borderRadius: '2px',
					},
				});

				new Elem({
					appendTo: left,
					textContent: getMineralLabel(mineralType, mineral),
					style: {
						color: theme.colors.gray,
						fontSize: '11px',
					},
				});

				new Elem({
					appendTo: row,
					textContent: `${count} (${percentage}%)`,
					style: {
						color: theme.colors.white,
						fontSize: '11px',
						fontWeight: 'bold',
					},
				});
			});
		}

		// Mineral Items breakdown - processed minerals, ores, etc.
		const mineralItems = Object.entries(stats.itemBreakdown).filter(
			([type]) =>
				!type.startsWith('pure_') &&
				!type.includes('mineral_pure_') &&
				(type.includes('ore') ||
					type.includes('ingot') ||
					type.includes('crystal') ||
					type.includes('fragment') ||
					type.includes('shard') ||
					type.includes('mineral')),
		);
		if (mineralItems.length > 0) {
			const totalMineralItems = mineralItems.reduce((sum, [, count]) => sum + count, 0);

			new Elem({
				appendTo: statsPanel,
				textContent: `> Mineral Items: ${totalMineralItems}`,
				styles: {
					color: theme.colors.lighter(theme.colors.blue),
					fontSize: '13px',
					marginTop: '15px',
					marginBottom: '10px',
				},
			});

			mineralItems.sort(([, a], [, b]) => b - a).forEach(([itemType, count]) => {
				const row = new StatsRow({ appendTo: statsPanel });

				new Elem({
					appendTo: row,
					textContent: itemType.replace(/_/g, ' '),
					styles: {
						color: theme.colors.gray,
						fontSize: '11px',
						textTransform: 'capitalize',
					},
				});

				new Elem({
					appendTo: row,
					textContent: String(count),
					styles: {
						color: theme.colors.white,
						fontSize: '11px',
						fontWeight: 'bold',
					},
				});
			});
		}

		// Other Items breakdown - oil, repair_nanites, etc.
		const otherItems = Object.entries(stats.itemBreakdown).filter(
			([type]) =>
				!type.startsWith('pure_') &&
				!type.includes('mineral_pure_') &&
				!type.includes('ore') &&
				!type.includes('ingot') &&
				!type.includes('crystal') &&
				!type.includes('fragment') &&
				!type.includes('shard') &&
				!type.includes('mineral') &&
				type !== 'psykick_egg',
		);
		if (otherItems.length > 0) {
			const totalOtherItems = otherItems.reduce((sum, [, count]) => sum + count, 0);

			new Elem({
				appendTo: statsPanel,
				textContent: `> Other Items: ${totalOtherItems}`,
				style: {
					color: theme.colors.lighter(theme.colors.blue),
					fontSize: '12px',
					fontWeight: 'bold',
					marginTop: '12px',
					marginBottom: '8px',
				},
			});

			otherItems.sort(([, a], [, b]) => b - a).forEach(([itemType, count]) => {
				const row = new StatsRow({ appendTo: statsPanel });

				new Elem({
					appendTo: row,
					textContent: itemType.replace(/_/g, ' '),
					style: {
						color: theme.colors.gray,
						fontSize: '11px',
						textTransform: 'capitalize',
					},
				});

				new Elem({
					appendTo: row,
					textContent: String(count),
					style: {
						color: theme.colors.white,
						fontSize: '11px',
						fontWeight: 'bold',
					},
				});
			});
		}

		// Alien breakdown
		if (Object.keys(stats.alienBreakdown).length > 0) {
			new Elem({
				appendTo: statsPanel,
				textContent: '> Aliens Detail',
				styles: {
					color: theme.colors.lighter(theme.colors.blue),
					fontSize: '13px',
					marginTop: '15px',
					marginBottom: '10px',
				},
			});

			Object.entries(stats.alienBreakdown)
				.sort(([, a], [, b]) => b - a)
				.forEach(([alienType, count]) => {
					const row = new StatsRow({ appendTo: statsPanel });

					new Elem({
						appendTo: row,
						textContent: alienType.replace(/_/g, ' '),
						styles: {
							color: theme.colors.gray,
							fontSize: '11px',
							textTransform: 'capitalize',
						},
					});

					new Elem({
						appendTo: row,
						textContent: String(count),
						styles: {
							color: theme.colors.white,
							fontSize: '11px',
							fontWeight: 'bold',
						},
					});
				});
		}
	}

	drawAsteroid(canvas) {
		const { asteroid, overlays } = this.state;
		const ctx = canvas.getContext('2d');
		const cellSize = Math.min(550 / asteroid.width, 450 / asteroid.depth);

		// Clear with stars pattern background
		if (!this.backgroundPattern) {
			const img = new Image();
			img.src = 'img/background.svg';
			img.onload = () => {
				this.backgroundPattern = ctx.createPattern(img, 'repeat');
				this.drawAsteroid(canvas); // Redraw with pattern
			};
			// Fallback to black while loading
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, 550, 450);
			return;
		}
		ctx.fillStyle = this.backgroundPattern;
		ctx.fillRect(0, 0, 550, 450);

		// Calculate centering
		const offsetX = (550 - asteroid.width * cellSize) / 2;
		const offsetY = (450 - asteroid.depth * cellSize) / 2;

		// Draw grid
		for (let x = 0; x < asteroid.width; x++) {
			for (let y = 0; y < asteroid.depth; y++) {
				const cell = asteroid.grid[x]?.[y];
				if (!cell) continue;

				const pixelX = offsetX + x * cellSize;
				const pixelY = offsetY + y * cellSize;

				// Ground minerals (base layer)
				if (cell.ground?.type) {
					const mineralType = cell.ground.type.replace('mineral_', '');
					const mineral = minerals[mineralType];
					if (mineral && overlays[mineralType]) {
						ctx.fillStyle = mineral.tint;
						ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
					}
				}

				// Hazards (override base layer)
				if (cell.hazards?.length > 0) {
					cell.hazards.forEach(hazard => {
						if (hazard.type === 'lava' && overlays.lava) {
							ctx.fillStyle = '#FF6600';
							ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
						} else if (hazard.type === 'gas' && overlays.gas) {
							ctx.globalAlpha = 0.6;
							ctx.fillStyle = '#FFFF00';
							ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
							ctx.globalAlpha = 1.0;
						}
					});
				}

				// Items (overlays on top)
				if (cell.items?.length > 0) {
					const psykickEggs = cell.items.filter(item => item.name === 'psykick_egg');
					const pureMineralItems = cell.items.filter(item => {
						if (!item.name) return false;
						return item.name.startsWith('pure_') || item.name.includes('mineral_pure_');
					});
					const mineralItems = cell.items.filter(item => {
						if (!item.name) return false;
						return (
							!item.name.startsWith('pure_') &&
							!item.name.includes('mineral_pure_') &&
							item.name !== 'psykick_egg' &&
							(item.name.includes('ore') ||
								item.name.includes('ingot') ||
								item.name.includes('crystal') ||
								item.name.includes('fragment') ||
								item.name.includes('shard') ||
								item.name.includes('mineral'))
						);
					});
					const otherItems = cell.items.filter(item => {
						if (!item.name) return false;
						return (
							!item.name.startsWith('pure_') &&
							!item.name.includes('mineral_pure_') &&
							item.name !== 'psykick_egg' &&
							!item.name.includes('ore') &&
							!item.name.includes('ingot') &&
							!item.name.includes('crystal') &&
							!item.name.includes('fragment') &&
							!item.name.includes('shard') &&
							!item.name.includes('mineral')
						);
					});

					// Psykick eggs - magenta square
					if (psykickEggs.length > 0 && overlays.psykickEggs) {
						ctx.fillStyle = '#FF00FF';
						ctx.fillRect(pixelX + cellSize * 0.2, pixelY + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);
					}

					// Pure mineral items - black/white with count number or centered dot
					if (pureMineralItems.length > 0 && overlays.mineralItems) {
						const groundMineralType = cell.ground?.type?.replace('mineral_', '');
						const isDarkBackground = groundMineralType === 'black';
						ctx.fillStyle = isDarkBackground ? '#FFFFFF' : '#000000';

						// Sum up the actual crystal counts from each item
						const totalCount = pureMineralItems.reduce((sum, item) => sum + (item.count || 1), 0);

						if (totalCount === 1) {
							// Draw centered dot for single crystal
							ctx.beginPath();
							ctx.arc(
								pixelX + cellSize * 0.5,
								pixelY + cellSize * 0.5,
								cellSize * 0.2,
								0,
								Math.PI * 2
							);
							ctx.fill();
						} else {
							// Draw the count as text for multiple crystals
							ctx.font = `bold ${Math.max(10, cellSize * 0.5)}px monospace`;
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							ctx.fillText(
								totalCount.toString(),
								pixelX + cellSize * 0.5,
								pixelY + cellSize * 0.5,
							);
						}
					}

					// Mineral items - orange overlay with opacity based on count
					if (mineralItems.length > 0 && overlays.mineralItems) {
						const itemCount = mineralItems.length;
						const opacity = Math.min(0.3 + (itemCount - 1) * 0.23, 1.0);
						ctx.globalAlpha = opacity;
						ctx.fillStyle = '#FF8000';
						ctx.fillRect(pixelX + cellSize * 0.15, pixelY + cellSize * 0.15, cellSize * 0.7, cellSize * 0.7);
						ctx.globalAlpha = 1.0;
					}

					// Other items - cyan square (LARGER SIZE to match standalone)
					if (otherItems.length > 0 && overlays.otherItems) {
						ctx.fillStyle = '#00FFFF';
						ctx.fillRect(pixelX + cellSize * 0.1, pixelY + cellSize * 0.1, cellSize * 0.9, cellSize * 0.9);
					}
				}
			}
		}

		// Draw aliens (top layer)
		if (asteroid.aliens && overlays.aliens) {
			Object.values(asteroid.aliens).forEach(alien => {
				if (alien.x !== undefined && alien.y !== undefined) {
					const cell = asteroid.grid[alien.x]?.[alien.y];
					const hasGround = cell?.ground?.type;
					ctx.fillStyle = hasGround ? '#8B0000' : '#FF0000';
					ctx.fillRect(
						offsetX + alien.x * cellSize + cellSize * 0.15,
						offsetY + alien.y * cellSize + cellSize * 0.15,
						cellSize * 0.7,
						cellSize * 0.7,
					);
				}
			});
		}
	}

	calculateStats(asteroid) {
		const stats = {
			groundCells: 0,
			emptyCells: 0,
			lavaCount: 0,
			gasCount: 0,
			psykickEggCount: 0,
			mineralItemCount: 0,
			otherItemCount: 0,
			alienCount: 0,
			mineralBreakdown: {},
			itemBreakdown: {},
			alienBreakdown: {},
		};

		const totalCells = asteroid.width * asteroid.depth;

		for (let x = 0; x < asteroid.width; x++) {
			for (let y = 0; y < asteroid.depth; y++) {
				const cell = asteroid.grid[x]?.[y];
				if (!cell) continue;

				if (cell.ground?.type) {
					stats.groundCells++;
					const mineralType = cell.ground.type.replace('mineral_', '');
					stats.mineralBreakdown[mineralType] = (stats.mineralBreakdown[mineralType] || 0) + 1;
				}

				if (cell.hazards?.length > 0) {
					cell.hazards.forEach(hazard => {
						if (hazard.type === 'lava') stats.lavaCount++;
						if (hazard.type === 'gas') stats.gasCount++;
					});
				}

				if (cell.items?.length > 0) {
					cell.items.forEach(item => {
						const itemKey = item.name || item.type || 'unknown';
						if (itemKey === 'psykick_egg') {
							stats.psykickEggCount++;
							stats.itemBreakdown['psykick_egg'] = (stats.itemBreakdown['psykick_egg'] || 0) + 1;
						} else {
							const itemType = itemKey.replace('pure_', '');
							if (minerals[itemType]) {
								stats.mineralItemCount++;
								stats.itemBreakdown[itemKey] = (stats.itemBreakdown[itemKey] || 0) + 1;
							} else {
								stats.otherItemCount++;
								stats.itemBreakdown[itemKey] = (stats.itemBreakdown[itemKey] || 0) + 1;
							}
						}
					});
				}
			}
		}

		stats.emptyCells = totalCells - stats.groundCells;
		stats.coveragePercent = Math.round((stats.groundCells / totalCells) * 100);

		if (asteroid.aliens) {
			stats.alienCount = Object.keys(asteroid.aliens).length;
			Object.values(asteroid.aliens).forEach(alien => {
				if (alien.type) {
					stats.alienBreakdown[alien.type] = (stats.alienBreakdown[alien.type] || 0) + 1;
				}
			});
		}

		return stats;
	}

	async handleGenerate() {
		const { worldConfig } = this.state;
		this.state.generating = true;
		this.state.asteroid = null;
		this.refresh();

		try {
			const response = await fetch('/api/dev/generate-asteroid', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(worldConfig),
			});

			if (!response.ok) throw new Error('Generation failed');

			const asteroid = await response.json();
			this.state.asteroid = asteroid;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Generation failed:', error);
			alert('Failed to generate asteroid: ' + error.message);
		} finally {
			this.state.generating = false;
			this.refresh();
		}
	}

	async handleSave() {
		const { selectedWorld, asteroid } = this.state;
		this.state.saving = true;
		this.refresh();

		try {
			const response = await fetch('/api/dev/save-world', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ worldId: selectedWorld, asteroid }),
			});

			const result = await response.json();
			if (result.success) {
				alert('World saved successfully!');
			} else {
				alert('Save failed: ' + result.message);
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Save failed:', error);
			alert('Save failed: ' + error.message);
		} finally {
			this.state.saving = false;
			this.refresh();
		}
	}

	async handleCopyToClipboard() {
		const { asteroid } = this.state;
		const json = JSON.stringify(asteroid, null, 2);

		try {
			await navigator.clipboard.writeText(json);
			console.log('✅ Asteroid JSON copied to clipboard');
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			// Fallback: select text in a temporary textarea
			const textarea = document.createElement('textarea');
			textarea.value = json;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			console.log('✅ Asteroid JSON copied to clipboard (fallback)');
		}
	}

}
