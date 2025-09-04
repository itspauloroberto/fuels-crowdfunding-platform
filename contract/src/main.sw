contract;

use std::storage::storage_map::StorageMap;
use std::address::Address;
use std::identity::Identity;

// Minimal campaign data structure as requested
struct Campaign {
    id: u64,
    asset_id: Option<b256>,
    owner: Identity,
    target_goal: u64,
    deadline: u64,
    total_raised: u64,
}

storage {
    // keep previous counter example
    next_id: u64 = 1,

    // crowdfunding storage
    campaign_count: u64 = 0,
    campaigns: StorageMap<u64, Campaign> = StorageMap {},
}

abi Crowdfund {
    // 1) Create a campaign with provided attributes
    #[storage(read, write)]
    fn create_campaign(
        target_goal: u64,
        deadline: u64,
    ) -> u64;

    // Read-only helpers for tests/clients
    #[storage(read)]
    fn get_campaign(id: u64) -> Campaign;

    #[storage(read)]
    fn get_campaign_count() -> u64;

    #[storage(read)]
    fn get_next_id() -> u64;

    #[storage(read)]
    fn get_campaign_owner_addr(id: u64) -> Option<Address>;

    // TODO 2: users contribute tokens to campaign
    // TODO 3: campaign reached goal and can be claimed
    // TODO 4: campaign reached deadline without fulfilling the goal so contributors can refund
    // TODO 5: users can opt-out the campaign by asking for refund during its period
    // TODO 6: implement claim type of campaign: flexible | all or nothing
    // TODO 7: implement contribution model: hard cap (cannot contribute once goal reached) or soft cap (can still contribute after goal meets)
}

impl Crowdfund for Contract {
    #[storage(read, write)]
    fn create_campaign(
        target_goal: u64,
        deadline: u64,
    ) -> u64 {
        let id = storage.next_id.read();
        
        let owner = msg_sender().unwrap();

        let campaign = Campaign {
            id,
            asset_id: Option::None,
            owner,
            target_goal,
            deadline,
            total_raised: 0,
        };

        storage.campaigns.insert(id, campaign);
        storage.next_id.write(id + 1);
        storage.campaign_count.write(storage.campaign_count.read() + 1);
        id
    }

    #[storage(read)]
    fn get_campaign(id: u64) -> Campaign {
        storage.campaigns.get(id).read()
    }

    #[storage(read)]
    fn get_campaign_count() -> u64 {
        storage.campaign_count.read()
    }

    #[storage(read)]
    fn get_next_id() -> u64 {
        storage.next_id.read()
    }

    #[storage(read)]
    fn get_campaign_owner_addr(id: u64) -> Option<Address> {
        let c = storage.campaigns.get(id).read();
        match c.owner {
            Identity::Address(a) => Option::Some(a),
            _ => Option::None,
        }
    }
}
