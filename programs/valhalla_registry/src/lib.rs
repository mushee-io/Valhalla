use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZsrS4H3W6rFLboBiHLmZW");

#[program]
pub mod valhalla_registry {
    use super::*;

    pub fn initialize_world(
        ctx: Context<InitializeWorld>,
        world_id: String,
    ) -> Result<()> {
        require!(world_id.len() <= 32, ValhallaError::StringTooLong);

        let world = &mut ctx.accounts.world;
        world.authority = ctx.accounts.authority.key();
        world.world_id = world_id;
        world.agent_count = 0;
        world.property_count = 0;
        world.treasury_count = 0;
        world.token_count = 0;
        world.bump = ctx.bumps.world;
        Ok(())
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: String,
        identity_hash: [u8; 32],
    ) -> Result<()> {
        require!(agent_id.len() <= 32, ValhallaError::StringTooLong);

        let record = &mut ctx.accounts.agent;
        record.world = ctx.accounts.world.key();
        record.owner = ctx.accounts.authority.key();
        record.agent_id = agent_id;
        record.identity_hash = identity_hash;
        record.status = AgentStatus::Bound;
        record.bump = ctx.bumps.agent;

        ctx.accounts.world.agent_count = ctx
            .accounts
            .world
            .agent_count
            .checked_add(1)
            .ok_or(ValhallaError::Overflow)?;

        Ok(())
    }

    pub fn release_agent(ctx: Context<UpdateAgent>) -> Result<()> {
        ctx.accounts.agent.status = AgentStatus::Free;
        Ok(())
    }

    pub fn register_property(
        ctx: Context<RegisterProperty>,
        property_id: String,
        kind: String,
        zone_id: String,
        value: u64,
    ) -> Result<()> {
        require!(property_id.len() <= 32, ValhallaError::StringTooLong);
        require!(kind.len() <= 24, ValhallaError::StringTooLong);
        require!(zone_id.len() <= 32, ValhallaError::StringTooLong);

        let property = &mut ctx.accounts.property;
        property.world = ctx.accounts.world.key();
        property.owner = ctx.accounts.authority.key();
        property.property_id = property_id;
        property.kind = kind;
        property.zone_id = zone_id;
        property.value = value;
        property.bump = ctx.bumps.property;

        ctx.accounts.world.property_count = ctx
            .accounts
            .world
            .property_count
            .checked_add(1)
            .ok_or(ValhallaError::Overflow)?;

        Ok(())
    }

    pub fn transfer_property(
        ctx: Context<TransferProperty>,
        new_owner: Pubkey,
    ) -> Result<()> {
        require!(new_owner != Pubkey::default(), ValhallaError::InvalidOwner);
        ctx.accounts.property.owner = new_owner;
        Ok(())
    }

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        treasury_id: String,
        kind: TreasuryKind,
    ) -> Result<()> {
        require!(treasury_id.len() <= 32, ValhallaError::StringTooLong);

        let treasury = &mut ctx.accounts.treasury;
        treasury.world = ctx.accounts.world.key();
        treasury.authority = ctx.accounts.authority.key();
        treasury.treasury_id = treasury_id;
        treasury.kind = kind;
        treasury.bump = ctx.bumps.treasury;

        ctx.accounts.world.treasury_count = ctx
            .accounts
            .world
            .treasury_count
            .checked_add(1)
            .ok_or(ValhallaError::Overflow)?;

        Ok(())
    }

    pub fn deposit_treasury(
        ctx: Context<DepositTreasury>,
        lamports: u64,
    ) -> Result<()> {
        require!(lamports > 0, ValhallaError::InvalidAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        };
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts,
        );
        transfer(cpi_context, lamports)?;
        Ok(())
    }

    pub fn withdraw_treasury(
        ctx: Context<WithdrawTreasury>,
        lamports: u64,
    ) -> Result<()> {
        require!(lamports > 0, ValhallaError::InvalidAmount);

        let treasury_info = ctx.accounts.treasury.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let rent_floor = Rent::get()?.minimum_balance(TreasuryRecord::SPACE);
        let balance = treasury_info.lamports();

        require!(
            balance.saturating_sub(lamports) >= rent_floor,
            ValhallaError::InsufficientTreasury
        );

        **treasury_info.try_borrow_mut_lamports()? -= lamports;
        **authority_info.try_borrow_mut_lamports()? += lamports;
        Ok(())
    }

    pub fn register_token_intent(
        ctx: Context<RegisterTokenIntent>,
        token_id: String,
        ticker: String,
        supply: u64,
        liquidity: u64,
    ) -> Result<()> {
        require!(token_id.len() <= 32, ValhallaError::StringTooLong);
        require!(ticker.len() <= 8, ValhallaError::StringTooLong);
        require!(supply > 0, ValhallaError::InvalidAmount);

        let token = &mut ctx.accounts.token_intent;
        token.world = ctx.accounts.world.key();
        token.creator = ctx.accounts.authority.key();
        token.token_id = token_id;
        token.ticker = ticker;
        token.supply = supply;
        token.liquidity = liquidity;
        token.mint = None;
        token.bump = ctx.bumps.token_intent;

        ctx.accounts.world.token_count = ctx
            .accounts
            .world
            .token_count
            .checked_add(1)
            .ok_or(ValhallaError::Overflow)?;

        Ok(())
    }

    pub fn attach_token_mint(
        ctx: Context<AttachTokenMint>,
        mint: Pubkey,
    ) -> Result<()> {
        require!(mint != Pubkey::default(), ValhallaError::InvalidMint);
        ctx.accounts.token_intent.mint = Some(mint);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(world_id: String)]
pub struct InitializeWorld<'info> {
    #[account(
        init,
        payer = authority,
        space = WorldState::SPACE,
        seeds = [b"world", world_id.as_bytes()],
        bump
    )]
    pub world: Account<'info, WorldState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub world: Account<'info, WorldState>,
    #[account(
        init,
        payer = authority,
        space = AgentRecord::SPACE,
        seeds = [b"agent", world.key().as_ref(), agent_id.as_bytes()],
        bump
    )]
    pub agent: Account<'info, AgentRecord>,
    #[account(mut, address = world.authority)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    pub world: Account<'info, WorldState>,
    #[account(
        mut,
        has_one = world,
        constraint = agent.owner == authority.key() @ ValhallaError::Unauthorized
    )]
    pub agent: Account<'info, AgentRecord>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct RegisterProperty<'info> {
    #[account(mut)]
    pub world: Account<'info, WorldState>,
    #[account(
        init,
        payer = authority,
        space = PropertyRecord::SPACE,
        seeds = [b"property", world.key().as_ref(), property_id.as_bytes()],
        bump
    )]
    pub property: Account<'info, PropertyRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferProperty<'info> {
    pub world: Account<'info, WorldState>,
    #[account(
        mut,
        has_one = world,
        constraint = property.owner == authority.key() @ ValhallaError::Unauthorized
    )]
    pub property: Account<'info, PropertyRecord>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(treasury_id: String)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub world: Account<'info, WorldState>,
    #[account(
        init,
        payer = authority,
        space = TreasuryRecord::SPACE,
        seeds = [b"treasury", world.key().as_ref(), treasury_id.as_bytes()],
        bump
    )]
    pub treasury: Account<'info, TreasuryRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(mut)]
    pub treasury: Account<'info, TreasuryRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(
        mut,
        constraint = treasury.authority == authority.key() @ ValhallaError::Unauthorized
    )]
    pub treasury: Account<'info, TreasuryRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(token_id: String)]
pub struct RegisterTokenIntent<'info> {
    #[account(mut)]
    pub world: Account<'info, WorldState>,
    #[account(
        init,
        payer = authority,
        space = TokenIntent::SPACE,
        seeds = [b"token", world.key().as_ref(), token_id.as_bytes()],
        bump
    )]
    pub token_intent: Account<'info, TokenIntent>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AttachTokenMint<'info> {
    #[account(
        mut,
        constraint = token_intent.creator == authority.key() @ ValhallaError::Unauthorized
    )]
    pub token_intent: Account<'info, TokenIntent>,
    pub authority: Signer<'info>,
}

#[account]
pub struct WorldState {
    pub authority: Pubkey,
    pub world_id: String,
    pub agent_count: u64,
    pub property_count: u64,
    pub treasury_count: u64,
    pub token_count: u64,
    pub bump: u8,
}

impl WorldState {
    pub const SPACE: usize = 8 + 32 + 4 + 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct AgentRecord {
    pub world: Pubkey,
    pub owner: Pubkey,
    pub agent_id: String,
    pub identity_hash: [u8; 32],
    pub status: AgentStatus,
    pub bump: u8,
}

impl AgentRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 4 + 32 + 32 + 1 + 1;
}

#[account]
pub struct PropertyRecord {
    pub world: Pubkey,
    pub owner: Pubkey,
    pub property_id: String,
    pub kind: String,
    pub zone_id: String,
    pub value: u64,
    pub bump: u8,
}

impl PropertyRecord {
    pub const SPACE: usize =
        8 + 32 + 32 + (4 + 32) + (4 + 24) + (4 + 32) + 8 + 1;
}

#[account]
pub struct TreasuryRecord {
    pub world: Pubkey,
    pub authority: Pubkey,
    pub treasury_id: String,
    pub kind: TreasuryKind,
    pub bump: u8,
}

impl TreasuryRecord {
    pub const SPACE: usize = 8 + 32 + 32 + (4 + 32) + 1 + 1;
}

#[account]
pub struct TokenIntent {
    pub world: Pubkey,
    pub creator: Pubkey,
    pub token_id: String,
    pub ticker: String,
    pub supply: u64,
    pub liquidity: u64,
    pub mint: Option<Pubkey>,
    pub bump: u8,
}

impl TokenIntent {
    pub const SPACE: usize =
        8 + 32 + 32 + (4 + 32) + (4 + 8) + 8 + 8 + 33 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AgentStatus {
    Bound,
    Free,
    Dormant,
    Dead,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TreasuryKind {
    Agent,
    Team,
    Nation,
}

#[error_code]
pub enum ValhallaError {
    #[msg("String input exceeds the account limit")]
    StringTooLong,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Treasury would fall below rent-exempt reserve")]
    InsufficientTreasury,
    #[msg("Signer is not authorized")]
    Unauthorized,
}
