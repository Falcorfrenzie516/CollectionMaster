export const ACHIEVEMENTS=[
["seriously","SERIOUSLY?!","watch_rainbow_pack_leave_conveyor"],
["worth_it","WORTH IT.","purchase_first_rainbow_pack"],
["one_that_got_away","THE ONE THAT GOT AWAY","return_rare_pack_then_watch_disappear"],
["you_again","YOU AGAIN?!","same_max_card_sold_10_times"],
["bad_financial_decisions","BAD FINANCIAL DECISIONS","spend_nearly_all_money_on_one_pack"],
["i_can_explain","I CAN EXPLAIN...","reach_unopened_pack_cap"],
["back_to_basics","BACK TO BASICS","equip_starter_after_unlocking_rainbow_token"]
].map(([id,name,trigger])=>({id,name,trigger,secret:true}));