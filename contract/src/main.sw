contract;

use std::storage::storage_map::StorageMap;
use std::address::Address;
use std::identity::Identity;
use std::vec::Vec;
use std::call_frames::msg_asset_id;
use std::context::msg_amount;
use std::auth::msg_sender;

struct Campaign {
    id: u64,
    asset_id: Option<b256>,
    owner: Identity,
    target_goal: u64,
    deadline: u64,
    total_raised: u64,
}

storage {
    next_id: u64 = 1,

    // crowdfunding storage
    campaign_count: u64 = 0,
    campaigns: StorageMap<u64, Campaign> = StorageMap {},
}

abi Crowdfund {
    // 1) Create a campaign with provided attributes
    #[storage(read, write)]
    fn create_campaign(target_goal: u64, deadline: u64) -> u64;

    // Read-only helpers for tests/clients
    #[storage(read)]
    fn get_campaign(id: u64) -> Option<Campaign>;

    #[storage(read)]
    fn get_campaign_count() -> u64;

    #[storage(read)]
    fn get_next_id() -> u64;

    #[storage(read)]
    fn get_campaign_owner_addr(id: u64) -> Option<Address>;

    // Return all campaigns currently stored (ordered by id ascending)
    #[storage(read)]
    fn list_campaigns() -> Vec<Campaign>;

    // MVP contribution: increases total_raised by provided amount (payable)
    #[storage(read, write)]
    #[payable]
    fn contribute(id: u64, amount: u64) -> u64;

    // TODO 1: campaign reached goal and can be claimed
    // TODO 2: campaign reached deadline without fulfilling the goal so contributors can refund
    // TODO 3: users can opt-out the campaign by asking for refund during its period
    // TODO 4: implement claim type of campaign: flexible | all or nothing
    // TODO 5: implement contribution model: hard cap (cannot contribute once goal reached) or soft cap (can still contribute after goal meets)
    // TODO 6: separate interface abi from implementation in different files
}

impl Crowdfund for Contract {
    #[storage(read, write)]
    fn create_campaign(target_goal: u64, deadline: u64) -> u64 {
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
    fn get_campaign(id: u64) -> Option<Campaign> {
        let last = storage.next_id.read();
        if id == 0 || id >= last {
            return Option::None;
        }
        let campaign = storage.campaigns.get(id).read();
        Option::Some(campaign)
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

    #[storage(read)]
    fn list_campaigns() -> Vec<Campaign> {
        let mut response = Vec::new();
        let last = storage.next_id.read();
        if last == 1 {
            return response;
        }
        let mut i = 1;
        while i < last {
            let campaign = storage.campaigns.get(i).read();
            response.push(campaign);
            i = i + 1;
        }
        response
    }

    #[storage(read, write)]
    #[payable]
    fn contribute(id: u64, amount: u64) -> u64 {
        let last = storage.next_id.read();
        require(id > 0 && id < last, "Invalid Campaign ID.");
        require(amount > 0, "Invalid contribution amount.");

        let mut campaign = storage.campaigns.get(id).read();
        assert(msg_amount() == amount);

        let incoming_asset: b256 = msg_asset_id().into();
        match campaign.asset_id {
            Option::None => {
                campaign.asset_id = Option::Some(incoming_asset);
            }
            Option::Some(existing) => {
                assert(existing == incoming_asset);
            }
        };

        campaign.total_raised = campaign.total_raised + amount;
        storage.campaigns.insert(id, campaign);
        campaign.total_raised
    }
}
