import { gameLog } from '../../../utils/logger.js';
import {
	AlphaTunnelChomper,
	AncientDepthGuardian,
	DepthGuardian,
	EarthMover,
	ElitePsykickWarrior,
	EnhancedGasSporecyst,
	GasSporecyst,
	GiftBearer,
	GrandSpawnMother,
	HiveDrone,
	HiveSoldier,
	LavaSpitter,
	MasterGiftBearer,
	MimicOre,
	PsykickScout,
	PsykickWarrior,
	ResourceSeeker,
	RockMite,
	SpawnMother,
	TunnelChomper,
	VoidDrifter,
	VolatileLavaSpitter,
} from './index';

const alienClasses = {
	alpha_tunnel_chomper: AlphaTunnelChomper,
	ancient_depth_guardian: AncientDepthGuardian,
	depth_guardian: DepthGuardian,
	earth_mover: EarthMover,
	elite_psykick_warrior: ElitePsykickWarrior,
	enhanced_gas_sporecyst: EnhancedGasSporecyst,
	gas_sporecyst: GasSporecyst,
	gift_bearer: GiftBearer,
	grand_spawn_mother: GrandSpawnMother,
	hive_drone: HiveDrone,
	hive_soldier: HiveSoldier,
	lava_spitter: LavaSpitter,
	master_gift_bearer: MasterGiftBearer,
	mimic_ore: MimicOre,
	psykick_scout: PsykickScout,
	psykick_warrior: PsykickWarrior,
	resource_seeker: ResourceSeeker,
	rock_mite: RockMite,
	spawn_mother: SpawnMother,
	tunnel_chomper: TunnelChomper,
	void_drifter: VoidDrifter,
	volatile_lava_spitter: VolatileLavaSpitter,
};

export const createAlien = (scene, x, y, alienType, orientation = 'right') => {
	const AlienClass = alienClasses[alienType];

	if (!AlienClass) {
		gameLog(2)(`Unknown alien type requested`, { alienType, availableTypes: Object.keys(alienClasses) });
		return null;
	}

	const alien = new AlienClass(scene, x, y);
	alien.setOrientation(orientation);

	return alien;
};

export { alienClasses };
