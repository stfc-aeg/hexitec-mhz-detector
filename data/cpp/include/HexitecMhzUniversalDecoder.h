/*
 * HexitecMhzDecoder.h
 *
 *  Created on: 12 September 2024
 *      Author: Dominic Banks, STFC Detector Systems Software Group
 */

#ifndef INCLUDE_HEXITECMHZ_UNIVERSAL_DECODER_H_
#define INCLUDE_HEXITECMHZ_UNIVERSAL_DECODER_H_

#include <network/PacketProtocolDecoder.h>
#include <rte_byteorder.h>
#include <rte_memcpy.h>
#include <rte_ether.h>
#include <rte_ip.h>
#include <rte_udp.h>
#include <boost/shared_ptr.hpp>
#include <map>
#include <string>
#include "dpdk_version_compatibiliy.h"

// Mode enumeration
enum class HexitecMhzMode {
    HISTOGRAM_4096_BINS,
    HISTOGRAM_2048_BINS,
    HISTOGRAM_1024_BINS,
    HISTOGRAM_512_BINS,
    HISTOGRAM_256_BINS,
    HISTOGRAM_128_BINS,
    RAW_12BIT,
    UNPACKED_12_16BIT
};

// Configuration for each mode
struct ModeConfiguration {
    std::size_t packets_per_frame;
    std::size_t payload_size;
    std::size_t frame_outer_chunk_size;
    FrameProcessor::DataType bit_depth;
    bool needs_reordering;
    bool is_histogram;
};

// Packet header structures
struct __rte_packed_begin X10GPacketHeader : PacketHeader
{
    rte_be64_t frame_number;
    rte_be64_t padding[6];
    rte_be32_t packet_number;
    uint8_t markers;
    uint8_t _unused_1;
    uint8_t padding_bytes;
    uint8_t readout_lane;
} __rte_packed_end;

// Alternative packet header for histogram modes
// Bit marking overun Specta 512 - 128 - 1
//
struct __rte_packed_begin X10GPacketHeaderHistogram : PacketHeader
{
    rte_be64_t padding[7];
    rte_be64_t frame_number;
} __rte_packed_end;

// Frame header structure
struct __rte_packed_begin X10GRawFrameHeader : RawFrameHeader
{
    uint64_t frame_number;
    uint32_t packets_received;
    uint32_t sof_marker_count;
    uint32_t eof_marker_count;
    uint64_t frame_start_time;
    uint64_t frame_complete_time;
    uint32_t frame_time_delta;
    uint64_t image_size;
    uint8_t packet_state[1];  // Flexible array member
} __rte_packed_end;

class HexitecMhzUniversalDecoder : public PacketProtocolDecoder
{
public:
    // String to mode mapping
    static const std::map<std::string, HexitecMhzMode>& get_mode_string_map() {
        static const std::map<std::string, HexitecMhzMode> mode_string_map = {
            {"histogram_4096", HexitecMhzMode::HISTOGRAM_4096_BINS},
            {"histogram_2048", HexitecMhzMode::HISTOGRAM_2048_BINS},
            {"histogram_1024", HexitecMhzMode::HISTOGRAM_1024_BINS},
            {"histogram_512", HexitecMhzMode::HISTOGRAM_512_BINS},
            {"histogram_256", HexitecMhzMode::HISTOGRAM_256_BINS},
            {"histogram_128", HexitecMhzMode::HISTOGRAM_128_BINS},
            {"raw_12bit", HexitecMhzMode::RAW_12BIT},
            {"unpacked_12_16bit", HexitecMhzMode::UNPACKED_12_16BIT}
        };
        return mode_string_map;
    }
    
    // Constructor
    HexitecMhzUniversalDecoder(HexitecMhzMode initial_mode = HexitecMhzMode::UNPACKED_12_16BIT) :
        PacketProtocolDecoder(
            get_mode_configs().at(initial_mode).packets_per_frame,
            get_mode_configs().at(initial_mode).payload_size,
            get_mode_configs().at(initial_mode).frame_outer_chunk_size
        ),
        current_mode_(initial_mode)
    {
        configure_for_mode(initial_mode);
    }
    
    virtual ~HexitecMhzUniversalDecoder() { }
    
    // Mode management
    void set_mode(HexitecMhzMode new_mode) {
        if (new_mode != current_mode_) {
            current_mode_ = new_mode;
            configure_for_mode(new_mode);
        }
    }
    
    HexitecMhzMode get_mode() const { return current_mode_; }
    
    std::string get_mode_string() const {
        static const std::map<HexitecMhzMode, std::string> mode_to_string = {
            {HexitecMhzMode::HISTOGRAM_4096_BINS, "histogram_4096"},
            {HexitecMhzMode::HISTOGRAM_2048_BINS, "histogram_2048"},
            {HexitecMhzMode::HISTOGRAM_1024_BINS, "histogram_1024"},
            {HexitecMhzMode::HISTOGRAM_512_BINS, "histogram_512"},
            {HexitecMhzMode::HISTOGRAM_256_BINS, "histogram_256"},
            {HexitecMhzMode::HISTOGRAM_128_BINS, "histogram_128"},
            {HexitecMhzMode::RAW_12BIT, "raw_12bit"},
            {HexitecMhzMode::UNPACKED_12_16BIT, "unpacked_12_16bit"}
        };
        
        auto it = mode_to_string.find(current_mode_);
        return (it != mode_to_string.end()) ? it->second : "unknown";
    }
    
    // Override virtual functions from PacketProtocolDecoder
    virtual const std::size_t get_frame_header_size(void) const {
        std::size_t packet_marker_size = sizeof(X10GRawFrameHeader().packet_state);
        std::size_t packet_header_size = sizeof(X10GRawFrameHeader) +
            (packet_marker_size * packets_per_frame_ - 1);
        return packet_header_size;
    }
    
    virtual const std::size_t get_packet_header_size(void) const {
        // Both header types are the same size
        return sizeof(X10GPacketHeader);
    }
    
    // Get packet payload offset based on mode
    const std::size_t get_packet_payload_offset(void) const {
        if (mode_config_.is_histogram) {
            // For histogram modes, payload is at the start, header is at the end
            return sizeof(struct rte_ether_hdr) + sizeof(struct rte_ipv4_hdr) + sizeof(struct rte_udp_hdr);
        } else {
            // For non-histogram modes, header is before payload
            return sizeof(struct rte_ether_hdr) + sizeof(struct rte_ipv4_hdr) +  sizeof(struct rte_udp_hdr) + get_packet_header_size();
        }
    }

    // Frame header management
    void set_frame_number(RawFrameHeader* frame_hdr, uint64_t frame_number) {
        reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_number = frame_number;
    }
    
    const uint64_t get_frame_number(RawFrameHeader* frame_hdr) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_number;
    }
    
    void set_frame_start_time(RawFrameHeader* frame_hdr, uint64_t frame_start_time) {
        reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_start_time = frame_start_time;
    }
    
    const uint64_t get_frame_start_time(RawFrameHeader* frame_hdr) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_start_time;
    }
    
    void set_frame_complete_time(RawFrameHeader* frame_hdr, uint64_t frame_complete_time) {
        reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_complete_time = frame_complete_time;
    }
    
    const uint64_t get_frame_complete_time(RawFrameHeader* frame_hdr) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->frame_complete_time;
    }
    
    const uint64_t get_image_size(RawFrameHeader* frame_hdr) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->image_size;
    }
    
    void set_image_size(RawFrameHeader* frame_hdr, uint64_t image_size) const {
        reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->image_size = image_size;
    }
    
    // Packet management
    bool set_packet_received(RawFrameHeader* frame_hdr, uint32_t packet_number) {
        if (packet_number >= packets_per_frame_) {
            return false;
        }
        
        X10GRawFrameHeader* x10g_hdr = reinterpret_cast<X10GRawFrameHeader*>(frame_hdr);
        x10g_hdr->packet_state[packet_number] = 1;
        x10g_hdr->packets_received++;
        return true;
    }
    
    const uint32_t get_packets_received(RawFrameHeader* frame_hdr) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->packets_received;
    }
    
    const uint32_t get_packets_dropped(RawFrameHeader* frame_hdr) const {
        return packets_per_frame_ - reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->packets_received;
    }
    
    const uint8_t get_packet_state(RawFrameHeader* frame_hdr, uint32_t packet_number) const {
        return reinterpret_cast<X10GRawFrameHeader*>(frame_hdr)->packet_state[packet_number];
    }
    
    // Mode-dependent packet header extraction
    const uint64_t get_frame_number(PacketHeader* packet_hdr) const {
        if (mode_config_.is_histogram) {
            // For histogram modes, offset the packet header and extract using bit operations
            packet_hdr = reinterpret_cast<PacketHeader*>(
                reinterpret_cast<char*>(packet_hdr) + payload_size_
            );
            uint64_t frame_num = reinterpret_cast<X10GPacketHeaderHistogram*>(packet_hdr)->frame_number;
            return (frame_num >> 24);  // GET_HISTOGRAM_FRAME_NUMBER
        } else {
            // For raw/unpacked modes
            return reinterpret_cast<X10GPacketHeader*>(packet_hdr)->frame_number;
        }
    }
    
    const uint32_t get_packet_number(PacketHeader* packet_hdr) const {
        if (mode_config_.is_histogram) {
            // For histogram modes, offset the packet header and extract using bit operations
            packet_hdr = reinterpret_cast<PacketHeader*>(
                reinterpret_cast<char*>(packet_hdr) + payload_size_
            );
            uint64_t frame_num = reinterpret_cast<X10GPacketHeaderHistogram*>(packet_hdr)->frame_number;
            return (frame_num & 0xFFFF) - 1;  // GET_HISTOGRAM_PACKET_NUMBER
        } else {
            // For raw/unpacked modes
            return reinterpret_cast<X10GPacketHeader*>(packet_hdr)->packet_number;
        }
    }
    
    // Frame reordering
    SuperFrameHeader* reorder_frame(SuperFrameHeader* frame_hdr, SuperFrameHeader* reordered_frame) {
        if (mode_config_.needs_reordering && current_mode_ == HexitecMhzMode::UNPACKED_12_16BIT) {
            return reorder_unpacked_12_16bit(frame_hdr, reordered_frame);
        }
        
        // For histogram and raw modes, no reordering needed
        return frame_hdr;
    }
    
    SuperFrameHeader* reorder_frame(SuperFrameHeader* frame_hdr, boost::shared_ptr<FrameProcessor::Frame> reordered_frame) {
        // This overload typically isn't used for reordering
        return frame_hdr;
    }
    
    // Helper methods
    const std::size_t get_packets_per_frame() const { return packets_per_frame_; }
    const std::size_t get_payload_size() const { return payload_size_; }
    
    std::string get_bit_depth_string() const {
        switch(frame_bit_depth_) {
            case FrameProcessor::DataType::raw_16bit: return "16bit";
            case FrameProcessor::DataType::raw_32bit: return "32bit";
            default: return "unknown";
        }
    }
    
    // Frame dimension methods
    virtual std::vector<std::size_t> get_frame_dimensions(void) const override {
        std::vector<std::size_t> dims;
        dims.push_back(frame_x_resolution_);
        dims.push_back(frame_y_resolution_);
        
        // For histogram modes, add the bin dimension
        if (mode_config_.is_histogram) {
            switch(current_mode_) {
                case HexitecMhzMode::HISTOGRAM_4096_BINS:
                    dims.push_back(4096);
                    break;
                case HexitecMhzMode::HISTOGRAM_2048_BINS:
                    dims.push_back(2048);
                    break;
                case HexitecMhzMode::HISTOGRAM_1024_BINS:
                    dims.push_back(1024);
                    break;
                case HexitecMhzMode::HISTOGRAM_512_BINS:
                    dims.push_back(512);
                    break;
                case HexitecMhzMode::HISTOGRAM_256_BINS:
                    dims.push_back(256);
                    break;
                case HexitecMhzMode::HISTOGRAM_128_BINS:
                    dims.push_back(128);
                    break;
                default:
                    break;
            }
        }
        return dims;
    }
    
private:
    HexitecMhzMode current_mode_;
    ModeConfiguration mode_config_;
    
    // Mode configurations
    static const std::map<HexitecMhzMode, ModeConfiguration>& get_mode_configs() {
        static const std::map<HexitecMhzMode, ModeConfiguration> mode_configs = {
            //                                    packets  payload  chunk  bit_depth                            reorder  histogram
            {HexitecMhzMode::HISTOGRAM_4096_BINS, {12800,   8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::HISTOGRAM_2048_BINS, {6400,    8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::HISTOGRAM_1024_BINS, {3200,    8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::HISTOGRAM_512_BINS,  {1600,    8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::HISTOGRAM_256_BINS,  {800,     8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::HISTOGRAM_128_BINS,  {400,     8192,    1,    FrameProcessor::DataType::raw_32bit, false,   true}},
            {HexitecMhzMode::RAW_12BIT,           {2,       5120,    1000, FrameProcessor::DataType::raw_16bit, false,   false}},
            {HexitecMhzMode::UNPACKED_12_16BIT,   {2,       5120,    1000, FrameProcessor::DataType::raw_16bit, true,    false}}
        };
        return mode_configs;
    }
    
    void configure_for_mode(HexitecMhzMode mode) {
        mode_config_ = get_mode_configs().at(mode);
        
        // Update base class members
        packets_per_frame_ = mode_config_.packets_per_frame;
        payload_size_ = mode_config_.payload_size;
        frames_per_super_frame_ = mode_config_.frame_outer_chunk_size;
        frame_bit_depth_ = mode_config_.bit_depth;
        
        // Frame dimensions are fixed for all modes
        frame_x_resolution_ = 80;
        frame_y_resolution_ = 80;
    }
    
    SuperFrameHeader* reorder_unpacked_12_16bit(SuperFrameHeader* frame_hdr, SuperFrameHeader* reordered_frame) {
        // Copy the header
        rte_memcpy(reordered_frame, frame_hdr, 
                   get_super_frame_header_size() + 
                   (get_frame_header_size() * frames_per_super_frame_));
        
        // Get pointers to the pixel data
        uint16_t* packed_data = reinterpret_cast<uint16_t*>(get_image_data_start(frame_hdr));
        uint16_t* output_memory = reinterpret_cast<uint16_t*>(get_image_data_start(reordered_frame));
        
        // Process all packets in the super frame
        for (int packet = 0; packet < packets_per_frame_ * frames_per_super_frame_; packet++) {
            for (int beat = 0; beat < 80; beat++) {
                uint16_t* start_packed_beat = reinterpret_cast<uint16_t*>(
                    reinterpret_cast<char*>(packed_data) + (5120 * packet) + (64 * beat)
                );
                
                uint16_t* output_memory_beat = reinterpret_cast<uint16_t*>(
                    reinterpret_cast<char*>(output_memory) + (6400 * packet) + (80 * beat)
                );
                
                for (int byte = 0; byte < 20; byte++) {
                    // Get the starting input and output pixels
                    uint16_t* input_pixel = start_packed_beat + (byte * 3);
                    uint16_t* output_pixel = output_memory_beat + (byte * 4);
                    
                    // Unpack 12-bit data to 16-bit
                    // From: [12 AB][23 CD][45 EF]
                    // To:   [01 2A][0B 23][0C D4][05 EF]
                    output_pixel[0] = (input_pixel[0] & 0x0FFF);
                    output_pixel[1] = ((input_pixel[0] & 0xF000) >> 12) + ((input_pixel[1] & 0x00FF) << 4);
                    output_pixel[2] = ((input_pixel[1] & 0xFF00) >> 8) + ((input_pixel[2] & 0x000F) << 8);
                    output_pixel[3] = (input_pixel[2] & 0xFFF0) >> 4;
                }
            }
        }
        
        return reordered_frame;
    }
};

#endif // INCLUDE_HEXITECMHZ_UNIVERSAL_DECODER_H_